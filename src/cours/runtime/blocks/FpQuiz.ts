import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import type { MetadonneesBrique } from '../../content/types';
import { FpBlock } from './FpBlock';

export interface QuizOption {
  readonly id: string;
  readonly libelle: string;
}

export interface QuizQuestion {
  readonly id: string;
  readonly enonce: string;
  readonly options: readonly QuizOption[];
  readonly bonneReponse: string;
  readonly retourBonne: string;
  readonly retourErreur: string;
}

export class FpQuiz extends FpBlock {
  readonly metadonnees: MetadonneesBrique = {
    concepts: ['lecture chiffrée'],
    misconceptionsCiblees: ['réponse choisie sans contrôle'],
    dureeMinutes: 5,
    modalite: 'classe',
    regime: 'ouvert',
  };
  private interne: QuizQuestion | null = null;
  private choix: string | null = null;

  set question(valeur: QuizQuestion | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne = valeur === null ? null : this.copier(valeur);
    if (change) {
      this.choix = null;
    }
    this.refreshSiConnecte();
  }

  get question(): QuizQuestion | null {
    return this.interne;
  }

  renderHand(): EscapedHtml {
    const question = this.question;
    if (question === null) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    const options = this.ordonnerSelonLaGraine(question.options);
    return safeHtml`
      <section class="fp-carte fp-quiz__atelier">
        <p class="fp-enonce fp-quiz__enonce">${escapeHtml(question.enonce)}</p>
        <p class="fp-quiz__consigne">Choisissez une réponse avant de lire le retour.</p>
        <div class="fp-quiz__options" role="group" aria-label="Réponses possibles">
          ${options.map((option) => this.option(option))}
        </div>
        ${this.retour(question)}
      </section>
    `;
  }

  renderStage(): EscapedHtml {
    const question = this.question;
    if (question === null) {
      return safeHtml``;
    }
    return safeHtml`
      <section class="fp-scene fp-quiz__atelier">
        <p class="fp-enonce fp-quiz__enonce">${escapeHtml(question.enonce)}</p>
        <p class="fp-quiz__indication">Votez depuis votre écran.</p>
      </section>
    `;
  }

  renderBoard(): EscapedHtml {
    const question = this.question;
    if (question === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-quiz__atelier">
        <p class="fp-enonce fp-quiz__enonce">${escapeHtml(question.enonce)}</p>
        <span class="fp-badge">${escapeHtml(this.choix === null ? 'Réponse en attente' : 'Réponse reçue')} · ${this.metadonnees.dureeMinutes} min</span>
      </section>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.question?.id ?? null);
    if (this.mode() !== 'hand') {
      return;
    }
    for (const option of racine.querySelectorAll<HTMLButtonElement>('[data-testid="option"]')) {
      option.disabled = this.choix !== null;
      option.addEventListener('click', () => this.repondre(option.dataset['option'] ?? ''));
    }
  }

  private copier(question: QuizQuestion): QuizQuestion {
    return {
      id: question.id,
      enonce: question.enonce,
      options: question.options.map((option) => ({ ...option })),
      bonneReponse: question.bonneReponse,
      retourBonne: question.retourBonne,
      retourErreur: question.retourErreur,
    };
  }

  private option(option: QuizOption): EscapedHtml {
    return safeHtml`
      <button type="button" class="fp-quiz__option" data-testid="option" data-option="${escapeHtml(option.id)}">
        <span class="fp-quiz__lettre" aria-hidden="true">${escapeHtml(option.id.toUpperCase())}</span>
        <span>${escapeHtml(option.libelle)}</span>
      </button>
    `;
  }

  private retour(question: QuizQuestion): EscapedHtml {
    if (this.choix === null) {
      return safeHtml``;
    }
    const correct = this.choix === question.bonneReponse;
    const bonne = question.options.find((option) => option.id === question.bonneReponse);
    return safeHtml`
      <div class="fp-quiz__retour" data-testid="feedback" data-correct="${escapeHtml(String(correct))}" role="status" aria-live="polite">
        <strong>${escapeHtml(correct ? 'Juste.' : 'À revoir.')}</strong>
        <span>${escapeHtml(correct ? question.retourBonne : question.retourErreur)}</span>
        ${bonne === undefined || correct ? safeHtml`` : safeHtml`<span>Réponse attendue : ${escapeHtml(bonne.libelle)}</span>`}
      </div>
    `;
  }

  private repondre(valeur: string): void {
    const question = this.question;
    if (
      question === null ||
      this.choix !== null ||
      !question.options.some((option) => option.id === valeur)
    ) {
      return;
    }
    this.choix = valeur;
    this.emit('fp-quiz-submit', {
      questionId: question.id,
      valeur,
      correct: valeur === question.bonneReponse,
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
