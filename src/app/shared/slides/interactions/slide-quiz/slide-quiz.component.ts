import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PRESENTATION_PORT } from '../../../../core/ports/presentation.port';
import { loadInteraction } from '../interactions.util';

interface QuizInteraction {
  id?: string;
  slideId?: string;
  type: 'quiz';
  question: string;
  options: string[];
  correctIndex: number;
}

/**
 * Affiche un quiz interactif charge depuis `PRESENTATION_PORT`.
 * Le `slug` identifie la presentation, `interactionId` la question
 * (matche soit le `slideId` portant l'interaction, soit l'`id` legacy).
 */
@Component({
  selector: 'app-slide-quiz',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-quiz.component.html',
  styleUrl: './slide-quiz.component.scss',
})
export class SlideQuizComponent {
  readonly slug = input.required<string>();
  readonly interactionId = input.required<string>();

  protected readonly quiz = signal<QuizInteraction | null>(null);
  protected readonly error = signal<boolean>(false);
  protected readonly selectedIndex = signal<number | null>(null);

  private readonly port = inject(PRESENTATION_PORT);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    queueMicrotask(() => this.load());
  }

  protected select(index: number): void {
    if (this.selectedIndex() !== null) {
      return;
    }
    this.selectedIndex.set(index);
  }

  protected isCorrect(): boolean {
    const q = this.quiz();
    const sel = this.selectedIndex();
    return q !== null && sel !== null && sel === q.correctIndex;
  }

  private load(): void {
    loadInteraction<QuizInteraction>(
      this.port.getInteractions(this.slug()),
      'quiz',
      this.interactionId(),
      () => this.error.set(true),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((found) => found && this.quiz.set(found));
  }
}
