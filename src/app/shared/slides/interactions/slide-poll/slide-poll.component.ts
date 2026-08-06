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
import { PRESENTATION_PORT } from "../../../../core/ports/presentation.port";
import { loadInteraction } from "../interactions.util";

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

  /** Index de l'option choisie, ou `null` tant que l'utilisateur n'a pas vote. */
  protected readonly votedIndex = signal<number | null>(null);

  protected readonly totalVotes = computed(() =>
    Object.values(this.votes()).reduce((a, b) => a + b, 0),
  );

  /**
   * Libelle de l'option votee, destine a la region live du template.
   * `null` avant le vote : la region reste alors vide, ce qui evite qu'un
   * lecteur d'ecran annonce un etat inexistant au chargement.
   */
  protected readonly votedLabel = computed(() => {
    const index = this.votedIndex();
    const current = this.poll();
    if (index === null || current === null) {
      return null;
    }
    return current.options[index] ?? null;
  });

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
    this.votedIndex.set(index);
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
    loadInteraction<PollInteraction>(
      this.port.getInteractions(this.slug()),
      "poll",
      this.interactionId(),
      () => this.error.set(true),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((found) => found && this.poll.set(found));
  }
}
