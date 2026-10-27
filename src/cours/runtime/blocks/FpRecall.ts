import { DESACTIVE, type EscapedHtml, escapeHtml, safeHtml, VIDE } from '../core/html';
import { chaineDe, estNombreFini, estTexteNonVide } from '../core/valeurs';
import { Battement, SECONDE_MS } from './battement';
import { FpReponse } from './reponse';
import {
  type ContenuDeBrique,
  type OptionPublique,
  avecJeNeSaisPas,
  copierLeSocle,
  projeterOptions,
} from './projection';
import {
  bonneReponseRevelee,
  bonneReponseSansOptionMarquee,
  lireBonneOption,
  lireBonneReponse,
  marqueDOption,
} from './retours';

export interface RecallQuestionPublique extends ContenuDeBrique {
  readonly enonce: string;
  readonly options: readonly OptionPublique[];
}

const DELAI_RAPPEL_MS = 8000;

function projeterQuestion(source: RecallQuestionPublique): RecallQuestionPublique {
  return {
    ...copierLeSocle(source),
    enonce: source.enonce,
    options: projeterOptions(source.options),
  };
}

function delaiDuRappel(valeur: unknown): number {
  return estNombreFini(valeur) && valeur >= 0 ? valeur : DELAI_RAPPEL_MS;
}

export function rappelEcritAvantLesOptions(delaiMs: unknown): boolean {
  return delaiDuRappel(delaiMs) > 0;
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
    this.interneConsigne = estTexteNonVide(valeur) ? valeur : null;
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
    this.interneDelaiMs = delaiDuRappel(valeur);
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
    const rappel = chaineDe(brouillon, 'rappel');
    if (rappel === null) {
      return false;
    }
    this.rappel = rappel;
    return true;
  }

  override connectedCallback(): void {
    this.ouvrirLeRappel();
    super.connectedCallback();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.battement.arreter();
  }

  protected rendreLaQuestion(question: RecallQuestionPublique): EscapedHtml {
    const ecritAvantLesOptions = rappelEcritAvantLesOptions(this.delaiMs);
    const saisie =
      this.presentateur() || !ecritAvantLesOptions
        ? VIDE
        : safeHtml`<textarea class="fp-recall__champ" data-testid="rappel" rows="4" aria-label="${escapeHtml(this.texte('rappel-champ'))}">${escapeHtml(this.rappel)}</textarea>`;
    const suivi = this.presentateur() ? VIDE : this.suiviDeLEnvoi();
    const proposees = this.proposees();
    return safeHtml`
      <fieldset class="fp-carte fp-recall__billet">
        <legend class="fp-enonce">${escapeHtml(question.enonce)}</legend>
        <div class="fp-recall__corps">
          ${this.consigneRendue(ecritAvantLesOptions)}
          ${saisie}
          ${ecritAvantLesOptions ? this.compteur() : VIDE}
          ${this.optionsVisibles(proposees)}
          ${suivi}
          ${bonneReponseRevelee(this.texte('bonne-reponse'), bonneReponseSansOptionMarquee(this.bonneReponse, this.bonneOption, proposees))}
        </div>
      </fieldset>
    `;
  }

  private consigneRendue(ecritAvantLesOptions: boolean): EscapedHtml {
    const consigne =
      this.interneConsigne ?? (ecritAvantLesOptions ? this.texte('rappel-consigne') : null);
    if (consigne === null) {
      return VIDE;
    }
    return safeHtml`<p class="fp-recall__consigne" data-testid="consigne">${escapeHtml(consigne)}</p>`;
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
        this.signalerLeBrouillon({ rappel: champ.value });
      });
    }
    this.brancherLesBoutons(racine, '[data-option]', verrouille, ({ dataset }) =>
      this.choisir(dataset['option'] ?? ''),
    );
  }

  protected effacerLaSaisie(): void {
    this.rappel = '';
    this.choisie = null;
  }

  private ouvrirLeRappel(): void {
    this.suivreAffichage(this.question?.id ?? null);
  }

  private restantMs(): number {
    return this.interneOptionsAffichees ? 0 : this.restantDepuisAffichage(this.delaiMs);
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

  private proposees(): readonly OptionPublique[] {
    const question = this.question;
    if (question === null || this.restantMs() > 0) {
      return [];
    }
    return this.presentateur() ? question.options : avecJeNeSaisPas(question.options);
  }

  private optionsVisibles(proposees: readonly OptionPublique[]): EscapedHtml {
    if (proposees.length === 0) {
      return VIDE;
    }
    const boutons = proposees.map(
      (option) =>
        safeHtml`<button type="button" class="fp-recall__option" data-testid="option" data-option="${escapeHtml(option.id)}" aria-pressed="${escapeHtml(String(option.id === this.choisie))}"${marqueDOption(option.id, this.bonneOption, option.id === this.choisie)} ${this.presentateur() ? DESACTIVE : VIDE}>${escapeHtml(option.libelle)}</button>`,
    );
    return safeHtml`<div class="fp-recall__options" data-testid="options">${boutons}</div>`;
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
