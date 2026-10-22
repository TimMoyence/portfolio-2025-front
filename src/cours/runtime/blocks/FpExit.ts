import type { DonneesFpExit } from '../../../../contrat/types.gen';
import { DESACTIVE, type EscapedHtml, escapeHtml, safeHtml, VIDE } from '../core/html';
import { longueurDeLaSaisie } from '../core/longueur-de-texte';
import { chaineDe } from '../core/valeurs';
import { FpReponse } from './reponse';
import { type OptionPublique, copierLeSocle, projeterOptions } from './projection';

export type ExitBilletPublic = DonneesFpExit['billet'];

const ID_TEXTE_LIBRE = 'fp-exit-texte-libre';

function projeterBillet(source: ExitBilletPublic): ExitBilletPublic {
  return {
    ...copierLeSocle(source),
    question: source.question,
    invite: source.invite,
    longueurMax: source.longueurMax,
    options: projeterOptions(source.options),
  };
}

export class FpExit extends FpReponse<ExitBilletPublic> {
  private texteLibre = '';
  private choix: string | null = null;

  set billet(valeur: ExitBilletPublic | null) {
    this.poserLeContenu(valeur, projeterBillet);
    this.refreshSiConnecte();
  }

  get billet(): ExitBilletPublic | null {
    return this.interne;
  }

  protected reprendreLeBrouillon(brouillon: Readonly<Record<string, unknown>>): boolean {
    this.texteLibre = chaineDe(brouillon, 'texteLibre') ?? this.texteLibre;
    this.choix = chaineDe(brouillon, 'choix') ?? this.choix;
    return true;
  }

  protected rendreLaQuestion(billet: ExitBilletPublic): EscapedHtml {
    const imprime = this.surPapier() && !this.presentateur();
    const choix = imprime
      ? safeHtml`<ul class="fp-cases">${this.casesAImprimer(billet.options)}</ul>`
      : safeHtml`<div class="fp-exit__choix">${this.boutonsOption(billet.options)}</div>`;
    const redaction =
      this.presentateur() || imprime
        ? safeHtml`<p class="fp-exit__invite" data-testid="invite">${escapeHtml(billet.invite)}</p>`
        : safeHtml`<label class="fp-exit__invite" for="${escapeHtml(ID_TEXTE_LIBRE)}">${escapeHtml(billet.invite)}</label>
        <textarea class="fp-exit__champ" id="${escapeHtml(ID_TEXTE_LIBRE)}" data-testid="texte-libre" rows="3">${escapeHtml(this.texteLibre)}</textarea>
        <p class="fp-exit__jauge" data-testid="jauge">${escapeHtml(this.jauge(billet))}</p>
        <button type="button" class="fp-exit__envoyer" data-testid="envoyer">${escapeHtml(this.texte('envoyer'))}</button>
        <p aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
        ${this.recapitulatif()}
        ${this.verdictDeReponse(this.interneVerdict)}
        ${this.annonces()}`;
    return safeHtml`
      <fieldset class="fp-carte fp-exit__billet">
        <legend class="fp-enonce">${escapeHtml(billet.question)}</legend>
        <div class="fp-exit__corps">
          ${choix}
          ${redaction}
        </div>
      </fieldset>
    `;
  }

  bind(racine: ShadowRoot): void {
    const billet = this.billet;
    if (billet === null || !this.suivreEtSaisir(billet.id)) {
      return;
    }
    const verrouille = this.verrouille();
    const branche = this.brancherLaSaisie(
      racine,
      { champ: 'texte-libre', bouton: 'envoyer', verrouille },
      {
        saisir: (texte) => {
          this.texteLibre = texte;
          this.memoriser();
          const jauge = racine.querySelector('[data-testid="jauge"]');
          if (jauge !== null) {
            jauge.textContent = this.jauge(billet);
          }
        },
        envoyer: (texte) => this.envoyer(billet, texte),
      },
    );
    if (!branche) {
      return;
    }
    this.brancherLesBoutons(racine, '[data-option]', verrouille, ({ dataset }) =>
      this.selectionner(dataset['option'] ?? ''),
    );
  }

  protected effacerLaSaisie(): void {
    this.texteLibre = '';
    this.choix = null;
  }

  private jauge(billet: ExitBilletPublic): string {
    return `${longueurDeLaSaisie(this.texteLibre)} / ${billet.longueurMax}`;
  }

  private memoriser(): void {
    this.signalerLeBrouillon({
      texteLibre: this.texteLibre,
      choix: this.choix,
    });
  }

  private boutonsOption(options: readonly OptionPublique[]): readonly EscapedHtml[] {
    return options.map(
      (option) =>
        safeHtml`<button type="button" class="fp-exit__option" data-testid="option" data-option="${escapeHtml(option.id)}" aria-pressed="${escapeHtml(String(option.id === this.choix))}" ${this.presentateur() ? DESACTIVE : VIDE}>${escapeHtml(option.libelle)}</button>`,
    );
  }

  private recapitulatif(): EscapedHtml {
    if (!this.envoye && this.interneVerdict === null) {
      return VIDE;
    }
    return safeHtml`<div class="fp-exit__recap" data-testid="recap"><p class="fp-exit__recap-choix" data-testid="recap-choix">${escapeHtml(this.libelleChoisi())}</p><p class="fp-exit__recap-texte" data-testid="recap-texte">${escapeHtml(this.texteLibre)}</p></div>`;
  }

  private libelleChoisi(): string {
    return this.billet?.options.find((option) => option.id === this.choix)?.libelle ?? '';
  }

  private messageTropLong(billet: ExitBilletPublic): string {
    return `${this.texte('texte-libre-trop-long')} ${billet.longueurMax} ${this.texte('caracteres-maximum')}`;
  }

  private selectionner(valeur: string): void {
    if (this.verrouille()) {
      return;
    }
    this.choix = valeur;
    this.message = '';
    this.memoriser();
    this.refresh();
  }

  private envoyer(billet: ExitBilletPublic, brut: string): void {
    if (this.verrouille()) {
      return;
    }
    this.texteLibre = brut;
    if (this.choix === null) {
      this.refuserLEnvoi(this.texte('choix-obligatoire'));
      return;
    }
    if (longueurDeLaSaisie(brut) > billet.longueurMax) {
      this.refuserLEnvoi(this.messageTropLong(billet));
      return;
    }
    this.conclureLEnvoi('fp-exit-submit', {
      billetId: billet.id,
      valeur: this.choix,
      texteLibre: brut,
    });
  }
}
