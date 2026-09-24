import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { type OptionPublique, projeterMetadonnees, projeterOptions } from './projection';
import {
  estObjet,
  estVerdictDeReponse,
  lireBonneOption,
  lireBonneReponse,
  type VerdictDeReponse,
} from './retours';

export interface RecallQuestionPublique {
  readonly id: string;
  readonly enonce: string;
  readonly options: readonly OptionPublique[];
  readonly metadonnees: MetadonneesBrique;
}

const DELAI_RAPPEL_MS = 8000;
const PAS_MS = 1000;
const ID_JE_NE_SAIS_PAS = '__je_ne_sais_pas__';
const VIDE = escapeHtml('');
const DESACTIVE = safeHtml`disabled`;

export class FpRecall extends FpBlock {
  private interne: RecallQuestionPublique | null = null;
  private interneDelaiMs = DELAI_RAPPEL_MS;
  private interneOptionsAffichees = false;
  private interneVerdict: VerdictDeReponse | null = null;
  private rappel = '';
  private message = '';
  private envoye = false;
  private choisie: string | null = null;
  private interneConsigne: string | null = null;
  private bonneReponse: string | null = null;
  private bonneOption: string | null = null;
  private minuteur: ReturnType<typeof setInterval> | null = null;

  set consigne(valeur: string | null | undefined) {
    this.interneConsigne = typeof valeur === 'string' && valeur.trim() !== '' ? valeur : null;
    this.refreshSiConnecte();
  }

  get consigne(): string | null {
    return this.interneConsigne;
  }

  set corrige(valeur: unknown) {
    this.bonneReponse = lireBonneReponse(valeur);
    this.bonneOption = lireBonneOption(valeur);
    this.refreshSiConnecte();
  }

  set question(valeur: RecallQuestionPublique | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne =
      valeur === null
        ? null
        : {
            id: valeur.id,
            enonce: valeur.enonce,
            options: projeterOptions(valeur.options),
            metadonnees: projeterMetadonnees(valeur.metadonnees),
          };
    if (change) {
      this.rappel = '';
      this.message = '';
      this.envoye = false;
      this.choisie = null;
      this.interneVerdict = null;
    }
    this.ouvrirLeRappel();
    this.refreshSiConnecte();
  }

  get question(): RecallQuestionPublique | null {
    return this.interne;
  }

  set delaiMs(valeur: number) {
    this.interneDelaiMs = Number.isFinite(valeur) && valeur >= 0 ? valeur : DELAI_RAPPEL_MS;
    this.refreshSiConnecte();
  }

  get delaiMs(): number {
    return this.interneDelaiMs;
  }

  set optionsAffichees(valeur: boolean) {
    this.interneOptionsAffichees = valeur === true;
    if (this.interneOptionsAffichees) {
      this.arreter();
    }
    this.refreshSiConnecte();
  }

  get optionsAffichees(): boolean {
    return this.interneOptionsAffichees;
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
    if (estObjet(valeur) && typeof valeur['rappel'] === 'string' && !this.envoye) {
      this.rappel = valeur['rappel'];
      this.noterBrouillonRepris();
      this.refreshSiConnecte();
    }
  }

  override connectedCallback(): void {
    this.ouvrirLeRappel();
    super.connectedCallback();
  }

  disconnectedCallback(): void {
    this.arreter();
  }

  render(): EscapedHtml {
    const question = this.question;
    if (!question) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('chargement'))}</p>`;
    }
    const saisie = this.presentateur()
      ? escapeHtml('')
      : safeHtml`<textarea class="fp-recall__champ" data-testid="rappel" rows="4" aria-label="${escapeHtml(this.texte('rappel-champ'))}">${escapeHtml(this.rappel)}</textarea>`;
    const suivi = this.presentateur()
      ? escapeHtml('')
      : safeHtml`<p aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
        ${this.verdictDeReponse(this.interneVerdict)}
        ${this.annonces()}`;
    return safeHtml`
      <fieldset class="fp-carte fp-scene fp-recall__billet">
        <legend class="fp-enonce">${escapeHtml(question.enonce)}</legend>
        <p class="fp-recall__consigne" data-testid="consigne">${escapeHtml(this.consigneAffichee())}</p>
        ${saisie}
        ${this.compteur()}
        ${this.optionsVisibles()}
        ${suivi}
        ${this.bonneReponseRevelee()}
      </fieldset>
    `;
  }

  private consigneAffichee(): string {
    return this.interneConsigne ?? this.texte('rappel-consigne');
  }

  private bonneReponseRevelee(): EscapedHtml {
    if (this.bonneReponse === null) {
      return escapeHtml('');
    }
    return safeHtml`<p class="fp-encadre" data-etat="confirme" data-testid="bonne-reponse">${escapeHtml(this.texte('bonne-reponse'))} ${escapeHtml(this.bonneReponse)}</p>`;
  }

  bind(racine: ShadowRoot): void {
    this.planifier();
    if (this.presentateur()) {
      return;
    }
    const verrouille = this.verrouille();
    const champ = racine.querySelector<HTMLTextAreaElement>('[data-testid="rappel"]');
    if (champ !== null) {
      champ.disabled = verrouille;
      champ.addEventListener('input', () => {
        this.rappel = champ.value;
        this.signalerBrouillon(this.interne?.id ?? '', { rappel: champ.value });
      });
    }
    for (const bouton of racine.querySelectorAll<HTMLButtonElement>('[data-option]')) {
      bouton.disabled = verrouille;
      bouton.addEventListener('click', () => this.choisir(bouton.dataset['option'] ?? ''));
    }
  }

  private verrouille(): boolean {
    return this.verrouilleApresEnvoi(this.envoye, this.interneVerdict !== null);
  }

  private ouvrirLeRappel(): void {
    this.suivreAffichage(this.question?.id ?? null);
  }

  private restantMs(): number {
    return this.interneOptionsAffichees ? 0 : Math.max(0, this.delaiMs - this.depuisAffichage());
  }

  private annonce(): string {
    const restant = this.restantMs();
    if (restant <= 0) {
      return this.texte('rappel-termine');
    }
    return `${this.texte('rappel-restant')} ${Math.ceil(restant / PAS_MS)} s`;
  }

  private compteur(): EscapedHtml {
    return safeHtml`<p class="fp-recall__compte" aria-live="polite" data-testid="compte-a-rebours">${escapeHtml(this.annonce())}</p>`;
  }

  private optionsVisibles(): EscapedHtml {
    const question = this.question;
    if (question === null || this.restantMs() > 0) {
      return escapeHtml('');
    }
    const options = [
      ...question.options,
      { id: ID_JE_NE_SAIS_PAS, libelle: this.texte('je-ne-sais-pas') },
    ];
    const proposees = this.presentateur()
      ? options.filter((option) => option.id !== ID_JE_NE_SAIS_PAS)
      : options;
    const boutons = proposees.map(
      (option) =>
        safeHtml`<button type="button" class="fp-recall__option" data-testid="option" data-option="${escapeHtml(option.id)}"${this.marqueDeCorrection(option.id)} ${this.presentateur() ? DESACTIVE : VIDE}>${escapeHtml(option.libelle)}</button>`,
    );
    return safeHtml`<div class="fp-recall__options" data-testid="options">${boutons}</div>`;
  }

  private marqueDeCorrection(id: string): EscapedHtml {
    if (this.bonneOption === null) {
      return escapeHtml('');
    }
    if (id === this.bonneOption) {
      return safeHtml` data-correction="juste"`;
    }
    return id === this.choisie ? safeHtml` data-correction="fausse"` : escapeHtml('');
  }

  private planifier(): void {
    if (this.minuteur !== null || this.restantMs() <= 0) {
      return;
    }
    this.minuteur = setInterval(() => this.battre(), PAS_MS);
  }

  private arreter(): void {
    if (this.minuteur !== null) {
      clearInterval(this.minuteur);
      this.minuteur = null;
    }
  }

  private battre(): void {
    if (this.restantMs() <= 0) {
      this.arreter();
      this.refreshSiConnecte();
      return;
    }
    const compte = this.racine.querySelector('[data-testid="compte-a-rebours"]');
    if (compte !== null) {
      compte.textContent = this.annonce();
    }
  }

  private choisir(valeur: string): void {
    if (this.verrouille() || this.restantMs() > 0) {
      return;
    }
    this.envoye = true;
    this.choisie = valeur;
    this.message = this.messageApresEnvoi();
    this.emit('fp-recall-submit', {
      questionId: this.question?.id,
      valeur,
      rappel: this.rappel,
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
