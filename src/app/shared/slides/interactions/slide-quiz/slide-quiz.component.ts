import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  computed,
  OnInit,
  signal,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PRESENTATION_PORT } from '../../../../core/ports/presentation.port';
import { loadInteraction } from '../interactions.util';
import type { ModeInteraction } from '../mode-interaction';

export interface QuizInteraction {
  id?: string;
  slideId?: string;
  type: 'quiz';
  question: string;
  options: string[];
  correctIndex?: number;
  context?: string;
  competency?: string;
  explanation?: string;
  nextAction?: string;
}

@Component({
  selector: 'app-slide-quiz',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-quiz.component.html',
  styleUrl: './slide-quiz.component.scss',
})
export class SlideQuizComponent implements OnInit {
  readonly slug = input<string>('');
  readonly interactionId = input<string>('');
  readonly questionData = input<QuizInteraction | null>(null);
  readonly showCompetency = input<boolean>(false);
  readonly mode = input<ModeInteraction>('apercu');
  readonly selection = output<{ questionId: string; valeur: string; dureeMs: number }>();

  protected readonly quiz = signal<QuizInteraction | null>(null);
  protected readonly activeQuiz = computed(() => this.questionData() ?? this.quiz());
  protected readonly apercu = computed(
    () => this.mode() === 'apercu' && this.activeQuiz()?.correctIndex === undefined,
  );
  protected readonly error = signal<boolean>(false);
  protected readonly selectedIndex = signal<number | null>(null);

  private readonly port = inject(PRESENTATION_PORT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly startedAt = Date.now();

  ngOnInit(): void {
    this.load();
  }

  protected select(index: number): void {
    if (this.selectedIndex() !== null) {
      return;
    }
    this.selectedIndex.set(index);
    const quiz = this.activeQuiz();
    if (quiz?.id && this.mode() === 'seance') {
      this.selection.emit({
        questionId: quiz.id,
        valeur: `o${index + 1}`,
        dureeMs: Math.max(0, Date.now() - this.startedAt),
      });
    }
  }

  protected isCorrect(): boolean {
    const q = this.activeQuiz();
    const sel = this.selectedIndex();
    return q !== null && sel !== null && q.correctIndex !== undefined && sel === q.correctIndex;
  }

  private load(): void {
    const inline = this.questionData();
    if (inline !== null) {
      this.quiz.set(inline);
      return;
    }
    if (this.port === null) {
      this.error.set(true);
      return;
    }
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
