import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import {
  SlideComparisonComponent,
  SlideComponent,
  SlideCtaComponent,
  SlideDeckComponent,
  SlideGridComponent,
  SlideHeroComponent,
  SlideImageComponent,
  SlidePollComponent,
  SlideQuizComponent,
  SlideQuoteComponent,
  SlideReflectionComponent,
  SlideStatsComponent,
  SlideVideoComponent,
} from '../../shared/slides';
import type { QuizInteraction } from '../../shared/slides/interactions/slide-quiz/slide-quiz.component';

const QUIZ_DE_DEMONSTRATION: QuizInteraction = {
  type: 'quiz',
  question: 'Quelle tâche confier en premier à une IA ?',
  options: [
    'Une tâche répétitive et chronophage',
    'Une décision stratégique',
    'Un échange client sensible',
  ],
  correctIndex: 0,
  explanation: 'Commencez par ce qui se répète : le gain se mesure vite et le risque reste faible.',
};

@Component({
  selector: 'app-slides-library',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SlideDeckComponent,
    SlideComponent,
    SlideHeroComponent,
    SlideImageComponent,
    SlideVideoComponent,
    SlideStatsComponent,
    SlideQuoteComponent,
    SlideComparisonComponent,
    SlideGridComponent,
    SlideCtaComponent,
    SlideQuizComponent,
    SlidePollComponent,
    SlideReflectionComponent,
  ],
  templateUrl: './slides-library.component.html',
  styleUrl: './slides-library.component.scss',
})
export class SlidesLibraryComponent {
  protected readonly quizDeDemonstration = QUIZ_DE_DEMONSTRATION;

  constructor() {
    const meta = inject(Meta);
    meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }
}
