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
import { catchError, of } from "rxjs";
import { PRESENTATION_PORT } from "../../../../core/ports/presentation.port";
import {
  flattenInteractions,
  type FlatInteraction,
} from "../interactions.util";

interface PollInteraction {
  id?: string;
  slideId?: string;
  type: "poll";
  question: string;
  options: string[];
}

/**
 * Affiche un sondage interactif avec vote local et barres de pourcentage.
 * Charge la definition depuis `PRESENTATION_PORT` par `slug` + `interactionId`
 * (matche soit le `slideId` portant l'interaction, soit l'`id` legacy).
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
    flattenInteractions(this.port.getInteractions(this.slug()))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.error.set(true);
          return of([] as FlatInteraction[]);
        }),
      )
      .subscribe((list) => {
        const target = this.interactionId();
        const found = list.find(
          (i) => i.type === "poll" && (i.id === target || i.slideId === target),
        );
        if (found) {
          this.poll.set(found as unknown as PollInteraction);
        }
      });
  }
}
