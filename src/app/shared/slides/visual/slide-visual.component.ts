import { NgComponentOutlet } from '@angular/common';
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

interface VisualPresentation {
  readonly version: 2;
  readonly screenId: string;
  readonly renderer: string;
  readonly props: Readonly<Record<string, unknown>>;
}

function objet(value: unknown): Readonly<Record<string, unknown>> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : null;
}

export function aUnePresentation(slide: EcranContent): boolean {
  return Object.values(slide.donnees ?? {}).some((value) => {
    const contenu = objet(value);
    return objet(contenu?.['presentation'])?.['version'] === 2;
  });
}

function presentationDe(slide: EcranContent): VisualPresentation | null {
  for (const value of Object.values(slide.donnees ?? {})) {
    const presentation = objet(objet(value)?.['presentation']);
    if (
      presentation?.['version'] === 2 &&
      typeof presentation['screenId'] === 'string' &&
      typeof presentation['renderer'] === 'string' &&
      objet(presentation['props']) !== null
    ) {
      return presentation as unknown as VisualPresentation;
    }
  }
  return null;
}

@Component({
  selector: 'app-slide-visual',
  standalone: true,
  imports: [NgComponentOutlet, SlideQuizComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (layout(); as component) {
      @if (quizData(); as quiz) {
        <app-slide-quiz [questionData]="quiz" (selection)="reponse.emit($event)" />
      } @else {
        <ng-container *ngComponentOutlet="component; inputs: layoutInputs()" />
      }
      @if (nestedQuiz(); as quiz) {
        <app-slide-quiz [questionData]="quiz" (selection)="reponse.emit($event)" />
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
          }
        : {};
    return {
      ...inputs,
      ...reflectionInputs,
      ...(this.presentation()?.renderer === 'image-right' ? { reverse: true } : {}),
    };
  });
  protected readonly quizData = computed(() => {
    if (this.presentation()?.renderer !== 'quiz') return null;
    const quiz = objet(this.presentation()?.props['questionData']);
    return quiz === null ? null : (quiz as unknown as QuizInteraction);
  });
  protected readonly nestedQuiz = computed(() => {
    const quiz = objet(this.presentation()?.props['nestedQuiz']);
    return quiz === null ? null : (quiz as unknown as QuizInteraction);
  });
  protected readonly sourceLink = computed(() => {
    const link = objet(this.presentation()?.props['sourceLink']);
    return link !== null && typeof link['href'] === 'string' && typeof link['label'] === 'string'
      ? { href: link['href'], label: link['label'] }
      : null;
  });
}
