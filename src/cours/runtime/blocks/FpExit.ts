import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { type OptionPublique, projeterMetadonnees, projeterOptions } from './projection';
import { estObjet, estVerdictDeReponse, type VerdictDeReponse } from './retours';

export interface ExitBilletPublic {
  readonly id: string;
  readonly question: string;
  readonly invite: string;
  readonly options: readonly OptionPublique[];
  readonly metadonnees: MetadonneesBrique;
}

const LIMITE_TEXTE_LIBRE = 500;
const ID_TEXTE_LIBRE = 'fp-exit-texte-libre';
const VIDE = escapeHtml('');
const DESACTIVE = safeHtml`disabled`;

export class FpExit extends FpBlock {
  private interne: ExitBilletPublic | null = null;
  private interneVerdict: VerdictDeReponse | null = null;
  private texteLibre = '';
  private choix: string | null = null;
  private message = '';
  private envoye = false;

  set billet(valeur: ExitBilletPublic | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne =
      valeur === null
        ? null
        : {
            id: valeur.id,
            question: valeur.question,
            invite: valeur.invite,
            options: projeterOptions(valeur.options),
            metadonnees: projeterMetadonnees(valeur.metadonnees),
          };
    if (change) {
      this.texteLibre = '';
      this.choix = null;
      this.message = '';
      this.envoye = false;
      this.interneVerdict = null;
    }
    this.refreshSiConnecte();
  }

  get billet(): ExitBilletPublic | null {
    return this.interne;
  }

  set verdict(valeur: VerdictDeReponse | null) {
    this.interneVerdict =
      estVerdictDeReponse(valeur) && valeur.questionId === this.interne?.id ? valeur : null;
    this.refreshSiConnecte();
  }

  get verdict(): VerdictDeReponse | null {
    return this.interneVerdict;
  }

  set brouillon(valeur: unknown) {
    if (!estObjet(valeur) || this.envoye) {
      return;
    }
    const texte = valeur['texteLibre'];
    const choix = valeur['choix'];
    this.texteLibre = typeof texte === 'string' ? texte : this.texteLibre;
    this.choix = typeof choix === 'string' ? choix : this.choix;
    this.noterBrouillonRepris();
    this.refreshSiConnecte();
  }

  render(): EscapedHtml {
    const billet = this.billet;
    if (!billet) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('chargement'))}</p>`;
    }
    const redaction = this.presentateur()
      ? safeHtml`<p class="fp-exit__invite" data-testid="invite">${escapeHtml(billet.invite)}</p>`
      : safeHtml`<label class="fp-exit__invite" for="${escapeHtml(ID_TEXTE_LIBRE)}">${escapeHtml(billet.invite)}</label>
        <textarea class="fp-exit__champ" id="${escapeHtml(ID_TEXTE_LIBRE)}" data-testid="texte-libre" rows="3">${escapeHtml(this.texteLibre)}</textarea>
        <p class="fp-exit__jauge" data-testid="jauge">${this.texteLibre.length} / ${LIMITE_TEXTE_LIBRE}</p>
        <button type="button" class="fp-exit__envoyer" data-testid="envoyer">${escapeHtml(this.texte('envoyer'))}</button>
        <p aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
        ${this.recapitulatif()}
        ${this.verdictDeReponse(this.interneVerdict)}
        ${this.annonces()}`;
    return safeHtml`
      <fieldset class="fp-carte fp-scene fp-exit__billet">
        <legend class="fp-enonce">${escapeHtml(billet.question)}</legend>
        <div class="fp-exit__choix">${this.boutonsOption(billet.options)}</div>
        ${redaction}
      </fieldset>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.billet?.id ?? null);
    if (this.presentateur()) {
      return;
    }
    const champ = racine.querySelector<HTMLTextAreaElement>('[data-testid="texte-libre"]');
    const envoyer = racine.querySelector<HTMLButtonElement>('[data-testid="envoyer"]');
    if (champ === null || envoyer === null) {
      return;
    }
    const verrouille = this.verrouille();
    champ.disabled = verrouille;
    envoyer.disabled = verrouille;
    champ.addEventListener('input', () => {
      this.texteLibre = champ.value;
      this.memoriser();
    });
    envoyer.addEventListener('click', () => this.envoyer(champ.value));
    for (const bouton of racine.querySelectorAll<HTMLButtonElement>('[data-option]')) {
      bouton.disabled = verrouille;
      bouton.addEventListener('click', () => this.selectionner(bouton.dataset['option'] ?? ''));
    }
  }

  private verrouille(): boolean {
    return this.verrouilleApresEnvoi(this.envoye, this.interneVerdict !== null);
  }

  private memoriser(): void {
    this.signalerBrouillon(this.interne?.id ?? '', {
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
      return escapeHtml('');
    }
    return safeHtml`<div class="fp-exit__recap" data-testid="recap"><p class="fp-exit__recap-choix" data-testid="recap-choix">${escapeHtml(this.libelleChoisi())}</p><p class="fp-exit__recap-texte" data-testid="recap-texte">${escapeHtml(this.texteLibre)}</p></div>`;
  }

  private libelleChoisi(): string {
    return this.billet?.options.find((option) => option.id === this.choix)?.libelle ?? '';
  }

  private messageTropLong(): string {
    return `${this.texte('texte-libre-trop-long')} ${LIMITE_TEXTE_LIBRE} ${this.texte('caracteres-maximum')}`;
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

  private envoyer(brut: string): void {
    if (this.verrouille()) {
      return;
    }
    this.texteLibre = brut;
    if (this.choix === null) {
      this.message = this.texte('choix-obligatoire');
      this.refresh();
      return;
    }
    if (brut.length > LIMITE_TEXTE_LIBRE) {
      this.message = this.messageTropLong();
      this.refresh();
      return;
    }
    this.envoye = true;
    this.message = this.messageApresEnvoi();
    this.emit('fp-exit-submit', {
      billetId: this.billet?.id,
      valeur: this.choix,
      texteLibre: brut,
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
