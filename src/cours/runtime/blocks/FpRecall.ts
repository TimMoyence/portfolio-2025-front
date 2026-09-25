import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { Battement, SECONDE_MS } from './battement';
import { FpReponse } from './reponse';
import {
  type ContenuDeBrique,
  type OptionPublique,
  copierLeSocle,
  projeterOptions,
} from './projection';
import { lireBonneOption, lireBonneReponse } from './retours';

export interface RecallQuestionPublique extends ContenuDeBrique {
  readonly enonce: string;
  readonly options: readonly OptionPublique[];
}

const DELAI_RAPPEL_MS = 8000;
const ID_JE_NE_SAIS_PAS = '__je_ne_sais_pas__';
const VIDE = escapeHtml('');
const DESACTIVE = safeHtml`disabled`;

function projeterQuestion(source: RecallQuestionPublique): RecallQuestionPublique {
  return {
    ...copierLeSocle(source),
    enonce: source.enonce,
    options: projeterOptions(source.options),
  };
}

export class FpRecall extends FpReponse<RecallQuestionPublique> {
  private interneDelaiMs = DELAI_RAPPEL_MS;
  private interneOptionsAffichees = false;
  private rappel = '';
  private choisie: string | null = null;
  private interneConsigne: string | null = null;
  private bonneOption: string | null = null;
  private readonly battement = new Battement(() => this.battre());

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
    this.poserLeContenu(valeur, projeterQuestion);
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
      this.battement.arreter();
    }
    this.refreshSiConnecte();
  }

  get optionsAffichees(): boolean {
    return this.interneOptionsAffichees;
  }

  protected reprendreLeBrouillon(brouillon: Readonly<Record<string, unknown>>): boolean {
    const rappel = brouillon['rappel'];
    if (typeof rappel !== 'string') {
      return false;
    }
    this.rappel = rappel;
    return true;
  }

  override connectedCallback(): void {
    this.ouvrirLeRappel();
    super.connectedCallback();
  }

  disconnectedCallback(): void {
    this.battement.arreter();
  }

  protected rendreLaQuestion(question: RecallQuestionPublique): EscapedHtml {
    const saisie = this.presentateur()
      ? escapeHtml('')
      : safeHtml`<textarea class="fp-recall__champ" data-testid="rappel" rows="4" aria-label="${escapeHtml(this.texte('rappel-champ'))}">${escapeHtml(this.rappel)}</textarea>`;
    const suivi = this.presentateur() ? escapeHtml('') : this.suiviDeLEnvoi();
    return safeHtml`
      <fieldset class="fp-carte fp-scene fp-recall__billet">
        <legend class="fp-enonce">${escapeHtml(question.enonce)}</legend>
        <p class="fp-recall__consigne" data-testid="consigne">${escapeHtml(this.consigneAffichee())}</p>
        ${saisie}
        ${this.compteur()}
        ${this.optionsVisibles()}
        ${suivi}
        ${this.bonneReponseRevelee((bonne) => bonne)}
      </fieldset>
    `;
  }

  private consigneAffichee(): string {
    return this.interneConsigne ?? this.texte('rappel-consigne');
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

  protected effacerLaSaisie(): void {
    this.rappel = '';
    this.choisie = null;
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
    return `${this.texte('rappel-restant')} ${Math.ceil(restant / SECONDE_MS)} s`;
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
    if (this.restantMs() > 0) {
      this.battement.demarrer();
    }
  }

  private battre(): void {
    if (this.restantMs() <= 0) {
      this.battement.arreter();
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
    this.choisie = valeur;
    this.conclureLEnvoi('fp-recall-submit', {
      questionId: this.question?.id,
      valeur,
      rappel: this.rappel,
    });
  }
}
