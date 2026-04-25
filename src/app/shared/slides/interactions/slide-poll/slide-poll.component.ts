import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { catchError, of, type Observable } from "rxjs";
import { PRESENTATION_PORT } from "../../../../core/ports/presentation.port";

interface PollInteraction {
  id: string;
  type: "poll";
  question: string;
  options: string[];
}

/**
 * Affiche un sondage interactif avec vote local et barres de pourcentage.
 * Charge la définition depuis PRESENTATION_PORT par slug + interactionId.
 */
@Component({
  selector: "app-slide-poll",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-poll.component.html",
  styleUrl: "./slide-poll.component.scss",
})
export class SlidePollComponent {
  readonly slug = input.required<string>();
  readonly interactionId = input.required<string>();

  protected readonly poll = signal<PollInteraction | null>(null);
  protected readonly error = signal<boolean>(false);
  protected readonly votes = signal<Record<number, number>>({});
  protected readonly hasVoted = signal<boolean>(false);

  protected readonly totalVotes = computed(() =>
    Object.values(this.votes()).reduce((a, b) => a + b, 0),
  );

  private readonly port = inject(PRESENTATION_PORT);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    queueMicrotask(() => this.load());
  }

  protected vote(index: number): void {
    if (this.hasVoted()) {
      return;
    }
    this.votes.update((v) => ({ ...v, [index]: (v[index] ?? 0) + 1 }));
    this.hasVoted.set(true);
  }

  protected percent(index: number): number {
    const total = this.totalVotes();
    if (total === 0) {
      return 0;
    }
    return Math.round(((this.votes()[index] ?? 0) / total) * 100);
  }

  private load(): void {
    (
      this.port.getInteractions(this.slug()) as unknown as Observable<
        PollInteraction[]
      >
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.error.set(true);
          return of([] as PollInteraction[]);
        }),
      )
      .subscribe((list) => {
        const found = list.find(
          (i) => i.id === this.interactionId() && i.type === "poll",
        );
        if (found) {
          this.poll.set(found);
        }
      });
  }
}
