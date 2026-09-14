import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { shuffleWithSeed } from '../core/seed';
import { FpBlock } from './FpBlock';
import { type OptionPublique, projeterOptions } from './projection';

export interface SpacedOption extends OptionPublique {
  readonly misconception: string | null;
}

export interface SpacedQuestionPublique {
  readonly questionId: string;
  readonly concept: string;
  readonly boite: number;
  readonly cours: string;
  readonly enonce: string;
  readonly options: readonly OptionPublique[];
}

export interface SpacedQuestion extends SpacedQuestionPublique {
  readonly options: readonly SpacedOption[];
}

const VIDE = escapeHtml('');

export class FpSpaced extends FpBlock {
  private interne: readonly SpacedQuestionPublique[] | null = null;
  private diagnostics: readonly string[] = [];
  private rang = 0;
  private message = '';
  private panne = false;

  set questions(valeur: readonly SpacedQuestion[] | null) {
    this.interne = valeur === null ? null : valeur.map((question) => this.projeter(question));
    this.diagnostics = valeur === null ? [] : this.diagnostiquer(valeur);
    this.rang = 0;
    this.message = '';
    this.suivreAffichage(this.cleAffichage());
    this.refreshSiConnecte();
  }

  get questions(): readonly SpacedQuestionPublique[] | null {
    return this.interne;
  }

  set erreur(valeur: boolean) {
    this.panne = valeur;
    this.refreshSiConnecte();
  }

  get erreur(): boolean {
    return this.panne;
  }

  get avancement(): number {
    return this.rang;
  }

  renderHand(): EscapedHtml {
    return safeHtml`
      <section class="fp-carte fp-spaced__seance">
        <p class="fp-spaced__consigne">${escapeHtml(this.texte('spaced-consigne'))}</p>
        ${this.avarie()}
        ${this.pupitre()}
        <p class="fp-spaced__annonce" role="status" aria-live="polite" data-testid="annonce">${escapeHtml(this.message)}</p>
      </section>
    `;
  }

  renderStage(): EscapedHtml {
    const question = this.questionCourante();
    return safeHtml`
      <section class="fp-scene fp-spaced__seance">
        ${this.avarie()}
        ${question === null ? this.etatSansQuestion() : this.projection(question)}
      </section>
    `;
  }

  renderBoard(): EscapedHtml {
    return safeHtml`
      <section class="fp-carte fp-spaced__seance">
        ${this.avarie()}
        ${this.questionCourante() === null ? this.etatSansQuestion() : this.progression()}
        ${this.tableauDesDues()}
        ${this.solutionnaire()}
      </section>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.cleAffichage());
    if (this.mode() !== 'hand') {
      return;
    }
    for (const bouton of racine.querySelectorAll<HTMLButtonElement>('[data-option]')) {
      bouton.addEventListener('click', () => this.repondre(bouton.dataset['option'] ?? ''));
    }
  }

  private projeter(source: SpacedQuestion): SpacedQuestionPublique {
    return {
      questionId: source.questionId,
      concept: source.concept,
      boite: source.boite,
      cours: source.cours,
      enonce: source.enonce,
      options:
        this.roleActuel() === 'presentateur' ? source.options : projeterOptions(source.options),
    };
  }

  private diagnostiquer(source: readonly SpacedQuestion[]): readonly string[] {
    if (this.roleActuel() !== 'presentateur') {
      return [];
    }
    return source.flatMap((question) =>
      question.options
        .map((option) => option.misconception)
        .filter((misconception): misconception is string => misconception !== null),
    );
  }

  private total(): number {
    return this.interne?.length ?? 0;
  }

  private acheve(): boolean {
    return this.total() > 0 && this.rang >= this.total();
  }

  private questionCourante(): SpacedQuestionPublique | null {
    return this.interne?.[this.rang] ?? null;
  }

  private cleAffichage(): string | null {
    return this.questionCourante()?.questionId ?? null;
  }

  private pupitre(): EscapedHtml {
    const question = this.questionCourante();
    if (question === null) {
      return this.etatSansQuestion();
    }
    return safeHtml`${this.projection(question)}${this.options(question)}`;
  }

  private projection(question: SpacedQuestionPublique): EscapedHtml {
    return safeHtml`
      ${this.progression()}
      ${this.reperes(question)}
      <p class="fp-enonce fp-spaced__enonce" data-testid="enonce">${escapeHtml(question.enonce)}</p>
    `;
  }

  private etatSansQuestion(): EscapedHtml {
    if (this.interne === null) {
      return safeHtml`<p class="fp-spaced__attente" data-testid="attente">${escapeHtml(this.texte('chargement'))}</p>`;
    }
    if (this.acheve()) {
      return safeHtml`<p class="fp-spaced__termine" data-testid="termine">${escapeHtml(this.texte('spaced-termine'))}</p>`;
    }
    return safeHtml`<p class="fp-spaced__vide" data-testid="vide">${escapeHtml(this.texte('spaced-vide'))}</p>`;
  }

  private progression(): EscapedHtml {
    const rang = Math.min(this.rang + 1, this.total());
    return safeHtml`<p class="fp-spaced__progression" data-testid="progression">${escapeHtml(this.texte('spaced-progression'))} ${rang} / ${this.total()}</p>`;
  }

  private reperes(question: SpacedQuestionPublique): EscapedHtml {
    return safeHtml`
      <p class="fp-spaced__reperes">
        <span class="fp-badge fp-spaced__origine" data-testid="origine"><span class="fp-spaced__mention">${escapeHtml(this.texte('spaced-origine'))}</span> ${escapeHtml(question.cours)}</span>
        <span class="fp-badge fp-spaced__boite" data-testid="boite" data-boite="${question.boite}">${escapeHtml(this.texte('spaced-boite'))} ${question.boite}</span>
        <span class="fp-spaced__concept" data-testid="concept">${escapeHtml(question.concept)}</span>
      </p>
    `;
  }

  private options(question: SpacedQuestionPublique): EscapedHtml {
    const boutons = shuffleWithSeed([...question.options], this.seed()).map(
      (option) =>
        safeHtml`<button type="button" class="fp-spaced__option" data-testid="option" data-option="${escapeHtml(option.id)}">${escapeHtml(option.libelle)}</button>`,
    );
    return safeHtml`<div class="fp-spaced__options" data-testid="options">${boutons}</div>`;
  }

  private tableauDesDues(): EscapedHtml {
    if (this.total() === 0) {
      return VIDE;
    }
    return safeHtml`<ul class="fp-spaced__liste" data-testid="liste">${(this.interne ?? []).map((question) => this.ligne(question))}</ul>`;
  }

  private ligne(question: SpacedQuestionPublique): EscapedHtml {
    return safeHtml`
      <li class="fp-spaced__ligne" data-testid="ligne" data-boite="${question.boite}">
        <span class="fp-spaced__nom">${escapeHtml(question.cours)}</span>
        <span class="fp-badge fp-spaced__boite">${escapeHtml(this.texte('spaced-boite'))} ${question.boite}</span>
        <span class="fp-spaced__concept">${escapeHtml(question.concept)}</span>
      </li>
    `;
  }

  private solutionnaire(): EscapedHtml {
    if (this.diagnostics.length === 0) {
      return VIDE;
    }
    return safeHtml`
      <p class="fp-spaced__mention">${escapeHtml(this.texte('spaced-diagnostics'))}</p>
      <ul class="fp-spaced__diagnostics" data-testid="diagnostics">${this.diagnostics.map((misconception) => safeHtml`<li class="fp-spaced__diagnostic">${escapeHtml(misconception)}</li>`)}</ul>
    `;
  }

  private avarie(): EscapedHtml {
    if (!this.panne) {
      return VIDE;
    }
    return safeHtml`<p class="fp-encadre fp-spaced__panne" role="status" data-testid="panne">${escapeHtml(this.texte('spaced-erreur'))}</p>`;
  }

  private repondre(optionId: string): void {
    const question = this.questionCourante();
    if (question === null) {
      return;
    }
    this.emit('fp-spaced-reponse', {
      questionId: question.questionId,
      optionId,
      dureeMs: this.depuisAffichage(),
    });
    this.rang += 1;
    this.message = this.acheve() ? this.texte('spaced-termine') : this.texte('reponse-enregistree');
    this.suivreAffichage(this.cleAffichage());
    this.refresh();
  }
}
