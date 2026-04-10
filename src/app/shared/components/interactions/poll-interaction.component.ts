import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from "@angular/core";
import type { PollInteraction } from "../../models/slide.model";

/**
 * Sondage interactif pour le mode present.
 *
 * Le présentateur demande un vote à main levée, puis clique sur chaque option
 * pour incrémenter le compteur. Les résultats s'affichent en barres animées
 * avec pourcentages calculés en temps réel.
 *
 * États : idle → voting → results
 * - idle : affiche la question et le bouton "Lancer le sondage"
 * - voting : affiche les options cliquables avec compteurs
 * - results : affiche les barres de résultats animées
 */
@Component({
  selector: "app-poll-interaction",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mx-auto w-full max-w-2xl rounded-2xl border-2 border-scheme-accent/20 bg-scheme-accent/[0.03] p-5 sm:p-6"
    >
      <p class="text-sm font-semibold text-gray-900 mb-4">
        {{ poll().question }}
      </p>

      @switch (state()) {
        @case ("idle") {
          <button
            type="button"
            class="w-full rounded-xl bg-scheme-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-scheme-accent-hover hover:shadow active:scale-[0.98]"
            (click)="startVoting()"
          >
            Lancer le sondage
          </button>
        }
        @case ("voting") {
          <div class="space-y-2">
            @for (option of poll().options; track option; let i = $index) {
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm transition-all hover:border-scheme-accent/40 hover:bg-scheme-accent/5 active:scale-[0.98]"
                (click)="vote(i)"
              >
                <span>{{ option }}</span>
                <span
                  class="ml-3 inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-scheme-accent/10 px-2 text-xs font-bold text-scheme-accent tabular-nums"
                >
                  {{ votes()[i] }}
                </span>
              </button>
            }
          </div>
          <button
            type="button"
            class="mt-4 w-full rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 active:scale-[0.98]"
            (click)="showResults()"
          >
            Voir les résultats
          </button>
        }
        @case ("results") {
          <div class="space-y-3">
            @for (option of poll().options; track option; let i = $index) {
              <div>
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="font-medium text-gray-700">{{ option }}</span>
                  <span
                    class="tabular-nums text-xs font-bold text-scheme-accent"
                  >
                    {{ votes()[i] }} — {{ percentages()[i] }}%
                  </span>
                </div>
                <div
                  class="h-3 w-full overflow-hidden rounded-full bg-gray-100"
                >
                  <div
                    class="h-full rounded-full bg-scheme-accent transition-all duration-700 ease-out"
                    [style.width.%]="percentages()[i]"
                  ></div>
                </div>
              </div>
            }
          </div>
          <button
            type="button"
            class="mt-4 text-xs font-medium text-gray-400 underline transition-colors hover:text-gray-600"
            (click)="reset()"
          >
            Recommencer
          </button>
        }
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class PollInteractionComponent {
  readonly poll = input.required<PollInteraction>();

  readonly state = signal<"idle" | "voting" | "results">("idle");
  readonly votes = signal<number[]>([]);

  /** Total des votes pour le calcul des pourcentages */
  private readonly totalVotes = computed(() =>
    this.votes().reduce((sum, v) => sum + v, 0),
  );

  /** Pourcentages arrondis par option */
  readonly percentages = computed(() => {
    const total = this.totalVotes();
    if (total === 0) return this.votes().map(() => 0);
    return this.votes().map((v) => Math.round((v / total) * 100));
  });

  startVoting(): void {
    this.votes.set(this.poll().options.map(() => 0));
    this.state.set("voting");
  }

  vote(index: number): void {
    this.votes.update((prev) => {
      const next = [...prev];
      next[index]++;
      return next;
    });
  }

  showResults(): void {
    this.state.set("results");
  }

  reset(): void {
    this.state.set("idle");
    this.votes.set([]);
  }
}
