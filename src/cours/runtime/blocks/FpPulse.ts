import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';

export type EtatPulse = 'perdu' | 'ca-va' | 'clair';

export type PulseComptes = Readonly<Record<EtatPulse, number>>;

export interface PulseSondage {
  readonly id: string;
  readonly invite: string;
  readonly metadonnees: MetadonneesBrique;
}

const ETATS: readonly EtatPulse[] = ['perdu', 'ca-va', 'clair'];

const FORMES: Readonly<Record<EtatPulse, string>> = {
  perdu: '▲',
  'ca-va': '■',
  clair: '●',
};

function compte(valeur: number): number {
  return Number.isFinite(valeur) && valeur > 0 ? Math.trunc(valeur) : 0;
}

function projeterComptes(source: PulseComptes): PulseComptes {
  return {
    perdu: compte(source.perdu),
    'ca-va': compte(source['ca-va']),
    clair: compte(source.clair),
  };
}

export class FpPulse extends FpBlock {
  private interne: PulseSondage | null = null;
  private interneComptes: PulseComptes | null = null;
  private choix: EtatPulse | null = null;

  set sondage(valeur: PulseSondage | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne =
      valeur === null
        ? null
        : {
            id: valeur.id,
            invite: valeur.invite,
            metadonnees: projeterMetadonnees(valeur.metadonnees),
          };
    if (change) {
      this.choix = null;
    }
    this.refreshSiConnecte();
  }

  get sondage(): PulseSondage | null {
    return this.interne;
  }

  set comptes(valeur: PulseComptes | null) {
    this.interneComptes = valeur === null ? null : projeterComptes(valeur);
    this.refreshSiConnecte();
  }

  get comptes(): PulseComptes | null {
    return this.interneComptes;
  }

  get etatChoisi(): EtatPulse | null {
    return this.choix;
  }

  renderHand(): EscapedHtml {
    const sondage = this.sondage;
    if (!sondage) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`
      <fieldset class="fp-carte fp-pulse__panneau">
        <legend>${escapeHtml(sondage.invite)}</legend>
        <p class="fp-pulse__anonymat" data-testid="anonymat">${escapeHtml(this.texte('pulse-anonymat'))}</p>
        <div class="fp-pulse__choix">${ETATS.map((etat) => this.bouton(etat))}</div>
        <p class="fp-pulse__retour" aria-live="polite" data-testid="retour">${escapeHtml(this.retour())}</p>
      </fieldset>
    `;
  }

  renderStage(): EscapedHtml {
    const sondage = this.sondage;
    if (!sondage) {
      return safeHtml``;
    }
    return safeHtml`<div class="fp-carte fp-scene"><p class="fp-enonce">${escapeHtml(sondage.invite)}</p>${this.agregat()}</div>`;
  }

  renderBoard(): EscapedHtml {
    const sondage = this.sondage;
    if (!sondage) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    return safeHtml`
      <div class="fp-carte fp-pulse__panneau">
        <p class="fp-enonce">${escapeHtml(sondage.invite)}</p>
        ${this.agregat()}
        <p class="fp-badge" data-testid="modalite">${escapeHtml(sondage.metadonnees.modalite)}</p>
      </div>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.sondage?.id ?? null);
    if (this.mode() !== 'hand') {
      return;
    }
    for (const bouton of racine.querySelectorAll<HTMLButtonElement>('[data-etat-pulse]')) {
      bouton.addEventListener('click', () => this.declarer(bouton.dataset['etatPulse'] ?? ''));
    }
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

  private bouton(etat: EtatPulse): EscapedHtml {
    return safeHtml`<button type="button" class="fp-pulse__etat" data-testid="etat" data-etat-pulse="${escapeHtml(etat)}" aria-pressed="${escapeHtml(String(etat === this.choix))}"><span class="fp-pulse__forme" aria-hidden="true">${escapeHtml(FORMES[etat])}</span><span class="fp-pulse__libelle">${escapeHtml(this.libelle(etat))}</span></button>`;
  }

  private ligne(comptes: PulseComptes, etat: EtatPulse): EscapedHtml {
    return safeHtml`<li class="fp-pulse__ligne" data-testid="ligne" data-etat-pulse="${escapeHtml(etat)}"><span class="fp-pulse__forme" aria-hidden="true">${escapeHtml(FORMES[etat])}</span><span class="fp-pulse__libelle">${escapeHtml(this.libelle(etat))}</span><span class="fp-pulse__compte" data-testid="compte">${comptes[etat]}</span></li>`;
  }

  private agregat(): EscapedHtml {
    const comptes = this.comptes;
    if (comptes === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    const total = ETATS.reduce((somme, etat) => somme + comptes[etat], 0);
    return safeHtml`
      <ul class="fp-pulse__agregat" data-testid="agregat">${ETATS.map((etat) => this.ligne(comptes, etat))}</ul>
      <p class="fp-pulse__total" data-testid="total">${escapeHtml(this.texte('pulse-total'))} ${total}</p>
    `;
  }

  private declarer(valeur: string): void {
    const etat = ETATS.find((connu) => connu === valeur);
    if (etat === undefined || etat === this.choix) {
      return;
    }
    this.choix = etat;
    this.emit('fp-pulse-change', {
      sondageId: this.sondage?.id,
      etat,
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
