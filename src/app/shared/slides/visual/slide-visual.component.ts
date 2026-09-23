import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  type Type,
} from '@angular/core';
import type { EcranContent, ResultatsSeance, Role } from '../../../../cours/content/types';
import {
  SlideChartComponent,
  SlideComparisonComponent,
  SlideCtaComponent,
  SlideGridComponent,
  SlideGuideComponent,
  SlideHeroComponent,
  SlideImageComponent,
  SlideMethodPathComponent,
  SlideQuoteComponent,
  SlideReflectionComponent,
  SlideSortReviewComponent,
  SlideStatsComponent,
  SlideTableComponent,
} from '..';
import type { QuizInteraction } from '../interactions/slide-quiz/slide-quiz.component';
import { SlideQuizComponent } from '../interactions/slide-quiz/slide-quiz.component';
import type { ModeInteraction } from '../interactions/mode-interaction';
import type { RetourBrique } from '../session/contrat-hote';
import { objet, presentationDe, quizImbrique, quizPrincipal } from './presentation-v2';

const layouts: Readonly<Record<string, Type<unknown>>> = {
  hero: SlideHeroComponent,
  'method-path': SlideMethodPathComponent,
  quiz: SlideQuizComponent,
  chart: SlideChartComponent,
  grid: SlideGridComponent,
  comparison: SlideComparisonComponent,
  stats: SlideStatsComponent,
  reflection: SlideReflectionComponent,
  quote: SlideQuoteComponent,
  table: SlideTableComponent,
  'image-left': SlideImageComponent,
  'image-right': SlideImageComponent,
  cta: SlideCtaComponent,
  guide: SlideGuideComponent,
  'sort-review': SlideSortReviewComponent,
};

function cartesDuTri(
  source: Readonly<Record<string, unknown>> | null,
  retours: ReadonlyMap<string, readonly RetourBrique[]>,
  juste: boolean,
): readonly string[] {
  const screenId = source?.['screenId'];
  const sortId = source?.['sortId'];
  if (typeof screenId !== 'string' || typeof sortId !== 'string') {
    return [];
  }
  return (retours.get(screenId) ?? []).flatMap((retour) =>
    retour.kind === 'verdict-production' && retour.questionId === sortId
      ? retour.details.filter((detail) => detail.juste === juste).map((detail) => detail.cle)
      : [],
  );
}

function commeQuiz(quiz: Readonly<Record<string, unknown>> | null): QuizInteraction | null {
  return quiz === null ? null : (quiz as unknown as QuizInteraction);
}

@Component({
  selector: 'app-slide-visual',
  standalone: true,
  imports: [NgComponentOutlet, NgTemplateOutlet, SlideQuizComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #quizDeLEcran let-quiz>
      <app-slide-quiz
        [questionData]="quiz"
        [mode]="mode()"
        [reponsesRecues]="reponsesRecues().get(quiz.id) ?? 0"
        [participants]="resultats()?.participants ?? 0"
        (selection)="reponse.emit($event)"
      />
    </ng-template>
    @if (layout(); as component) {
      @if (quizData(); as quiz) {
        <ng-container *ngTemplateOutlet="quizDeLEcran; context: { $implicit: quiz }" />
      } @else {
        <ng-container *ngComponentOutlet="component; inputs: layoutInputs()" />
      }
      @if (nestedQuiz(); as quiz) {
        <ng-container *ngTemplateOutlet="quizDeLEcran; context: { $implicit: quiz }" />
      }
      @if (sourceLink(); as link) {
        <p class="slide-visual__source">
          <a [href]="link.href" target="_blank" rel="noreferrer">{{ link.label }}</a>
        </p>
      }
    } @else {
      <p role="alert" i18n="@@slideVisualEcranInconnu">
        Cet écran ne peut pas être affiché : son contenu n’est pas reconnu.
      </p>
    }
  `,
  styles: `
    .slide-visual__source {
      margin: 1rem auto;
      max-width: 72rem;
      font-size: 0.8rem;
      color: var(--text-muted, #6d665b);
    }
    .slide-visual__source a {
      color: inherit;
      text-decoration: underline;
    }
    @container (min-height: 0px) {
      :host {
        display: block;
        position: relative;
      }
      .slide-visual__source {
        position: absolute;
        inset-inline: 3rem;
        inset-block-end: 0.5rem;
        margin: 0;
        max-width: none;
      }
    }
  `,
})
export class SlideVisualComponent {
  readonly slide = input.required<EcranContent>();
  readonly sessionId = input<string | null>(null);
  readonly jeton = input<string>('');
  readonly role = input<Role>('etudiant');
  readonly resultats = input<ResultatsSeance | null>(null);
  readonly prioritaire = input(false);
  readonly retours = input<ReadonlyMap<string, readonly RetourBrique[]>>(new Map());
  readonly reponse = output<{
    questionId: string;
    valeur: string;
    dureeMs: number;
    type?: 'libre' | 'qcm';
  }>();

  private readonly presentation = computed(() => presentationDe(this.slide()));
  protected readonly mode = computed<ModeInteraction>(() => {
    if (this.role() === 'presentateur') {
      return 'projection';
    }
    return this.sessionId() === null ? 'apercu' : 'seance';
  });
  protected readonly reponsesRecues = computed<ReadonlyMap<string, number>>(
    () =>
      new Map(
        (this.resultats()?.questions ?? []).map((question) => [
          question.questionId,
          question.total,
        ]),
      ),
  );
  protected readonly layout = computed(() => {
    const renderer = this.presentation()?.renderer;
    return renderer === undefined ? null : (layouts[renderer] ?? null);
  });
  protected readonly layoutInputs = computed(() => {
    const renderer = this.presentation()?.renderer;
    const props = this.presentation()?.props ?? {};
    const inputs = Object.fromEntries(
      Object.entries(props).filter(
        ([key]) =>
          key !== 'sourceLink' &&
          key !== 'nestedQuiz' &&
          !(renderer === 'sort-review' && key === 'source'),
      ),
    );
    const reflectionInputs =
      renderer === 'reflection'
        ? {
            screenId: this.slide().id,
            sessionId: this.sessionId(),
            jeton: this.jeton(),
            mode: this.mode(),
          }
        : {};
    const reviewInputs =
      renderer === 'sort-review'
        ? {
            misplaced: cartesDuTri(objet(props['source']), this.retours(), false),
            wellPlaced: cartesDuTri(objet(props['source']), this.retours(), true),
          }
        : {};
    return {
      ...inputs,
      ...reflectionInputs,
      ...reviewInputs,
      ...(renderer === 'image-right' ? { reverse: true } : {}),
      ...(renderer === 'hero' && this.prioritaire() ? { priority: true } : {}),
    };
  });
  protected readonly quizData = computed(() => commeQuiz(quizPrincipal(this.presentation())));
  protected readonly nestedQuiz = computed(() => commeQuiz(quizImbrique(this.presentation())));
  protected readonly sourceLink = computed(() => {
    const link = objet(this.presentation()?.props['sourceLink']);
    return link !== null && typeof link['href'] === 'string' && typeof link['label'] === 'string'
      ? { href: link['href'], label: link['label'] }
      : null;
  });
}
