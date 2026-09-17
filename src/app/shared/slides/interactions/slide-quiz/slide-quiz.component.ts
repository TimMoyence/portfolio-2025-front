import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  computed,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PRESENTATION_PORT } from '../../../../core/ports/presentation.port';
import { loadInteraction } from '../interactions.util';

export interface QuizInteraction {
  id?: string;
  slideId?: string;
  type: 'quiz';
  question: string;
  options: string[];
  correctIndex: number;
  context?: string;
  competency?: string;
  explanation?: string;
  nextAction?: string;
  askConfidence?: boolean;
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

  protected readonly quiz = signal<QuizInteraction | null>(null);
  protected readonly activeQuiz = computed(() => this.questionData() ?? this.quiz());
  protected readonly error = signal<boolean>(false);
  protected readonly selectedIndex = signal<number | null>(null);
  protected readonly confidence = signal<number | null>(null);

  private readonly port = inject(PRESENTATION_PORT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.load();
  }

  protected select(index: number): void {
    if (this.selectedIndex() !== null) {
      return;
    }
    this.selectedIndex.set(index);
  }

  protected selectConfidence(level: number): void {
    this.confidence.set(level);
  }

  protected isCorrect(): boolean {
    const q = this.activeQuiz();
    const sel = this.selectedIndex();
    return q !== null && sel !== null && sel === q.correctIndex;
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
