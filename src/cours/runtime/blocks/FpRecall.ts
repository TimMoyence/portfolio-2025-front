import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { type OptionPublique, projeterMetadonnees, projeterOptions } from './projection';

export interface RecallOption extends OptionPublique {
  readonly misconception: string | null;
}

export interface RecallQuestionPublique {
  readonly id: string;
  readonly enonce: string;
  readonly options: readonly OptionPublique[];
  readonly metadonnees: MetadonneesBrique;
}

export interface RecallQuestion extends RecallQuestionPublique {
  readonly options: readonly RecallOption[];
}

const DELAI_RAPPEL_MS = 8000;
const PAS_MS = 1000;

export class FpRecall extends FpBlock {
  private interne: RecallQuestionPublique | null = null;
  private interneDelaiMs = DELAI_RAPPEL_MS;
  private rappel = '';
  private message = '';
  private repondu = false;
  private minuteur: ReturnType<typeof setInterval> | null = null;

  set question(valeur: RecallQuestionPublique | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne = valeur === null ? null : this.projeter(valeur);
    if (change) {
      this.rappel = '';
      this.message = '';
      this.repondu = false;
    }
    this.ouvrirLeRappel();
    this.refreshSiConnecte();
  }

  get question(): RecallQuestionPublique | null {
    return this.interne;
  }

  set delaiMs(valeur: number) {
    this.interneDelaiMs = valeur;
    this.refreshSiConnecte();
  }

  get delaiMs(): number {
    return this.interneDelaiMs;
  }

  override connectedCallback(): void {
    this.ouvrirLeRappel();
    super.connectedCallback();
  }

  disconnectedCallback(): void {
    this.arreter();
  }

  renderHand(): EscapedHtml {
    const question = this.question;
    if (!question) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`
      <fieldset class="fp-carte fp-recall__billet">
        <legend>${escapeHtml(question.enonce)}</legend>
        <p class="fp-recall__consigne">${escapeHtml(this.texte('rappel-consigne'))}</p>
        <textarea class="fp-recall__champ" data-testid="rappel" rows="5">${escapeHtml(this.rappel)}</textarea>
        ${this.compteur()}
        ${this.optionsVisibles()}
        <p aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
      </fieldset>
    `;
  }

  renderStage(): EscapedHtml {
    const question = this.question;
    if (!question) {
      return safeHtml``;
    }
    return safeHtml`<div class="fp-carte fp-scene"><p class="fp-enonce">${escapeHtml(question.enonce)}</p>${this.compteur()}</div>`;
  }

  renderBoard(): EscapedHtml {
    const question = this.question;
    if (!question) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    const metadonnees = question.metadonnees;
    return safeHtml`
      <div class="fp-carte fp-recall__billet">
        <p class="fp-enonce">${escapeHtml(question.enonce)}</p>
        <p class="fp-recall__concepts" data-testid="concepts">${escapeHtml(metadonnees.concepts.join(' · '))}</p>
        <p class="fp-badge" data-testid="modalite">${escapeHtml(metadonnees.modalite)}</p>
        <p class="fp-badge" data-testid="duree">${metadonnees.dureeMinutes} min</p>
      </div>
    `;
  }

  bind(racine: ShadowRoot): void {
    if (this.mode() !== 'hand') {
      this.arreter();
      return;
    }
    this.planifier();
    const champ = racine.querySelector<HTMLTextAreaElement>('[data-testid="rappel"]');
    champ?.addEventListener('input', () => {
      this.rappel = champ.value;
    });
    for (const bouton of racine.querySelectorAll<HTMLButtonElement>('[data-option]')) {
      bouton.disabled = this.repondu;
      bouton.addEventListener('click', () => this.choisir(bouton.dataset['option'] ?? ''));
    }
  }

  private projeter(source: RecallQuestionPublique): RecallQuestionPublique {
    return {
      id: source.id,
      enonce: source.enonce,
      options:
        this.roleActuel() === 'presentateur' ? source.options : projeterOptions(source.options),
      metadonnees: projeterMetadonnees(source.metadonnees),
    };
  }

  private ouvrirLeRappel(): void {
    this.suivreAffichage(this.question?.id ?? null);
  }

  private restantMs(): number {
    return Math.max(0, this.delaiMs - this.depuisAffichage());
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
    const boutons = this.ordonnerSelonLaGraine(question.options).map(
      (option) =>
        safeHtml`<button type="button" class="fp-recall__option" data-testid="option" data-option="${escapeHtml(option.id)}">${escapeHtml(option.libelle)}</button>`,
    );
    return safeHtml`<div class="fp-recall__options" data-testid="options">${boutons}</div>`;
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
    if (this.repondu || this.restantMs() > 0) {
      return;
    }
    this.repondu = true;
    this.message = this.texte('reponse-enregistree');
    this.emit('fp-recall-submit', {
      questionId: this.question?.id,
      valeur,
      rappel: this.rappel,
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
