import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  type Type,
} from '@angular/core';
import type { EcranContent } from '../../../../cours/content/types';
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
  SlideStatsComponent,
  SlideTableComponent,
} from '..';
import type { QuizInteraction } from '../interactions/slide-quiz/slide-quiz.component';
import { SlideQuizComponent } from '../interactions/slide-quiz/slide-quiz.component';
import type { ModeInteraction } from '../interactions/mode-interaction';
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
};

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
      <app-slide-quiz [questionData]="quiz" [mode]="mode()" (selection)="reponse.emit($event)" />
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
      <p role="alert">Cet écran ne peut pas être affiché : son contenu n’est pas reconnu.</p>
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
  `,
})
export class SlideVisualComponent {
  readonly slide = input.required<EcranContent>();
  readonly sessionId = input<string | null>(null);
  readonly jeton = input<string>('');
  readonly reponse = output<{
    questionId: string;
    valeur: string;
    dureeMs: number;
    type?: 'libre' | 'qcm';
  }>();

  private readonly presentation = computed(() => presentationDe(this.slide()));
  protected readonly mode = computed<ModeInteraction>(() =>
    this.sessionId() === null ? 'apercu' : 'seance',
  );
  protected readonly layout = computed(() => {
    const renderer = this.presentation()?.renderer;
    return renderer === undefined ? null : (layouts[renderer] ?? null);
  });
  protected readonly layoutInputs = computed(() => {
    const props = this.presentation()?.props ?? {};
    const inputs = Object.fromEntries(
      Object.entries(props).filter(([key]) => key !== 'sourceLink' && key !== 'nestedQuiz'),
    );
    const reflectionInputs =
      this.presentation()?.renderer === 'reflection'
        ? {
            screenId: this.slide().id,
            sessionId: this.sessionId(),
            jeton: this.jeton(),
            mode: this.mode(),
          }
        : {};
    return {
      ...inputs,
      ...reflectionInputs,
      ...(this.presentation()?.renderer === 'image-right' ? { reverse: true } : {}),
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
