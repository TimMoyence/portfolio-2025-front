import type { EtatPulse } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpContenu } from './contenu';
import { type ContenuDeBrique, copierLeSocle } from './projection';
import { estObjet } from './retours';

export interface PulseComptes {
  readonly perdu: number;
  readonly 'ca-va': number;
  readonly clair: number;
  readonly total?: number;
}

export interface PulseSondage extends ContenuDeBrique {
  readonly invite: string;
}

const ETATS: readonly EtatPulse[] = ['perdu', 'ca-va', 'clair'];
const SEUIL_DE_PROJECTION = 5;
const VIDE = escapeHtml('');
const DESACTIVE = safeHtml`disabled`;

const FORMES: Readonly<Record<EtatPulse, string>> = {
  perdu: '▲',
  'ca-va': '■',
  clair: '●',
};

function compte(valeur: unknown): number {
  return typeof valeur === 'number' && Number.isFinite(valeur) && valeur > 0
    ? Math.trunc(valeur)
    : 0;
}

function projeterComptes(source: PulseComptes): Required<PulseComptes> {
  const comptes = {
    perdu: compte(source.perdu),
    'ca-va': compte(source['ca-va']),
    clair: compte(source.clair),
  };
  return { ...comptes, total: comptes.perdu + comptes['ca-va'] + comptes.clair };
}

function lireEtat(valeur: unknown): EtatPulse | null {
  return ETATS.find((etat) => etat === valeur) ?? null;
}

function copierSondage(source: PulseSondage): PulseSondage {
  return {
    ...copierLeSocle(source),
    invite: source.invite,
  };
}

export class FpPulse extends FpContenu<PulseSondage> {
  private interneComptes: Required<PulseComptes> | null = null;
  private choix: EtatPulse | null = null;

  set sondage(valeur: PulseSondage | null) {
    this.poserLeContenu(valeur, copierSondage);
    this.refreshSiConnecte();
  }

  get sondage(): PulseSondage | null {
    return this.interne;
  }

  set comptes(valeur: PulseComptes | null) {
    this.interneComptes = valeur === null ? null : projeterComptes(valeur);
    this.refreshSiConnecte();
  }

  get comptes(): Required<PulseComptes> | null {
    return this.interneComptes;
  }

  set brouillon(valeur: unknown) {
    const etat = estObjet(valeur) ? lireEtat(valeur['etat']) : null;
    if (etat !== null) {
      this.choix = etat;
      this.refreshSiConnecte();
    }
  }

  render(): EscapedHtml {
    const sondage = this.sondage;
    if (!sondage) {
      return this.attente();
    }
    const inerte = this.presentateur();
    const suivi = inerte
      ? this.suiviProjete()
      : safeHtml`<p class="fp-pulse__retour" aria-live="polite" data-testid="retour">${escapeHtml(this.retour())}</p>${this.annonces()}`;
    return safeHtml`
      <fieldset class="fp-carte fp-scene fp-pulse__panneau">
        <legend class="fp-enonce">${escapeHtml(sondage.invite)}</legend>
        <p class="fp-pulse__anonymat" data-testid="anonymat">${escapeHtml(this.texte('pulse-anonymat'))}</p>
        <div class="fp-pulse__choix">${ETATS.map((etat) => this.bouton(etat, inerte))}</div>
        ${suivi}
      </fieldset>
    `;
  }

  private suiviProjete(): EscapedHtml {
    const comptes = this.interneComptes;
    if (comptes === null) {
      return VIDE;
    }
    return comptes.total >= SEUIL_DE_PROJECTION ? this.agregat(comptes) : this.masque();
  }

  bind(racine: ShadowRoot): void {
    if (!this.suivreEtSaisir(this.sondage?.id ?? null)) {
      return;
    }
    for (const bouton of racine.querySelectorAll<HTMLButtonElement>('[data-etat-pulse]')) {
      bouton.addEventListener('click', () => this.declarer(bouton.dataset['etatPulse'] ?? ''));
    }
  }

  protected repartirDeZero(): void {
    this.choix = null;
  }

  private libelle(etat: EtatPulse): string {
    return this.texte(`pulse-${etat}`);
  }

  private retour(): string {
    if (this.choix === null) {
      return '';
    }
    return `${this.texte('pulse-votre-etat')} ${this.libelle(this.choix)}`;
  }

  private bouton(etat: EtatPulse, inerte = false): EscapedHtml {
    return safeHtml`<button type="button" class="fp-pulse__etat" data-testid="etat" data-etat-pulse="${escapeHtml(etat)}" aria-pressed="${escapeHtml(String(!inerte && etat === this.choix))}" ${inerte ? DESACTIVE : VIDE}><span class="fp-pulse__forme" aria-hidden="true">${escapeHtml(FORMES[etat])}</span><span class="fp-pulse__libelle">${escapeHtml(this.libelle(etat))}</span></button>`;
  }

  private ligne(comptes: Required<PulseComptes>, etat: EtatPulse): EscapedHtml {
    return safeHtml`<li class="fp-pulse__ligne" data-testid="ligne" data-etat-pulse="${escapeHtml(etat)}"><span class="fp-pulse__forme" aria-hidden="true">${escapeHtml(FORMES[etat])}</span><span class="fp-pulse__libelle">${escapeHtml(this.libelle(etat))}</span><span class="fp-pulse__compte" data-testid="compte">${comptes[etat]}</span></li>`;
  }

  private masque(): EscapedHtml {
    return safeHtml`<p class="fp-pulse__masque" data-testid="masque">${escapeHtml(this.texte('pulse-masque'))}</p>`;
  }

  private agregat(comptes: Required<PulseComptes>): EscapedHtml {
    return safeHtml`
      <ul class="fp-pulse__agregat" data-testid="agregat">${ETATS.map((etat) => this.ligne(comptes, etat))}</ul>
      <p class="fp-pulse__total" data-testid="total">${escapeHtml(this.texte('pulse-total'))} ${comptes.total}</p>
    `;
  }

  private declarer(valeur: string): void {
    const etat = lireEtat(valeur);
    if (etat === null || etat === this.choix) {
      return;
    }
    this.choix = etat;
    this.signalerBrouillon(this.sondage?.id ?? '', { etat });
    this.emit('fp-pulse-change', {
      sondageId: this.sondage?.id,
      etat,
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
