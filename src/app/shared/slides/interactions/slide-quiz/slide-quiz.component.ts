import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { catchError, of } from "rxjs";
import { PRESENTATION_PORT } from "../../../../core/ports/presentation.port";

interface QuizInteraction {
  id: string;
  type: "quiz";
  question: string;
  options: string[];
  correctIndex: number;
}

/**
 * Affiche un quiz interactif chargé depuis PRESENTATION_PORT.
 * Le slug identifie la présentation, interactionId la question.
 */
@Component({
  selector: "app-slide-quiz",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-quiz.component.html",
  styleUrl: "./slide-quiz.component.scss",
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
    (
      this.port.getInteractions(
        this.slug(),
      ) as unknown as import("rxjs").Observable<QuizInteraction[]>
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.error.set(true);
          return of([] as QuizInteraction[]);
        }),
      )
      .subscribe((list) => {
        const found = list.find(
          (i) => i.id === this.interactionId() && i.type === "quiz",
        );
        if (found) {
          this.quiz.set(found);
        }
      });
  }
}
