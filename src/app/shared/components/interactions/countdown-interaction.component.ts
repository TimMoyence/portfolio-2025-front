import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from "@angular/core";
import type { CountdownInteraction } from "../../models/slide.model";

/**
 * Compte à rebours dramatique pour le mode present.
 *
 * Le présentateur clique pour lancer un timer visible à l'écran.
 * Barre de progression circulaire + chiffres décomptés.
 * Utilisé pour les pauses réflexion ("Prenez 30 secondes pour y penser").
 */
@Component({
  selector: "app-countdown-interaction",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mx-auto w-full max-w-md rounded-2xl border-2 border-scheme-accent/20 bg-scheme-accent/[0.03] p-5 sm:p-6 text-center"
    >
      <p class="text-sm font-semibold text-gray-900 mb-4">
        {{ config().label }}
      </p>

      @switch (state()) {
        @case ("idle") {
          <button
            type="button"
            class="rounded-xl bg-scheme-accent px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-scheme-accent-hover hover:shadow active:scale-[0.98]"
            (click)="start()"
          >
            Lancer le timer
          </button>
        }
        @case ("running") {
          <!-- Timer circulaire -->
          <div class="relative mx-auto h-32 w-32">
            <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                class="text-gray-100"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                class="text-scheme-accent transition-all duration-1000 ease-linear"
                [style.stroke-dasharray]="circumference"
                [style.stroke-dashoffset]="dashOffset()"
              />
            </svg>
            <span
              class="absolute inset-0 flex items-center justify-center text-3xl font-heading text-gray-900 tabular-nums"
            >
              {{ remaining() }}
            </span>
          </div>
        }
        @case ("done") {
          <div class="text-2xl font-heading text-scheme-accent">Terminé !</div>
          <button
            type="button"
            class="mt-3 text-xs font-medium text-gray-400 underline transition-colors hover:text-gray-600"
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
export class CountdownInteractionComponent {
  readonly config = input.required<CountdownInteraction>();

  readonly state = signal<"idle" | "running" | "done">("idle");
  readonly remaining = signal(0);

  /** Circonférence du cercle SVG (r=45) */
  readonly circumference = 2 * Math.PI * 45;

  /** Offset du stroke pour l'animation de progression */
  readonly dashOffset = computed(() => {
    const total = this.config().durationSeconds;
    const ratio = total > 0 ? this.remaining() / total : 0;
    return this.circumference * (1 - ratio);
  });

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.destroyRef.onDestroy(() => this.clearInterval());
  }

  start(): void {
    const duration = this.config().durationSeconds;
    this.remaining.set(duration);
    this.state.set("running");

    this.intervalId = setInterval(() => {
      const next = this.remaining() - 1;
      if (next <= 0) {
        this.remaining.set(0);
        this.state.set("done");
        this.clearInterval();
      } else {
        this.remaining.set(next);
      }
    }, 1000);
  }

  reset(): void {
    this.clearInterval();
    this.state.set("idle");
    this.remaining.set(0);
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
