import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type { SebastianHealthScore } from "../../../core/models/sebastian.model";

/**
 * Carte affichant le score de sante Sebastian.
 * Decompose le score en adherence aux objectifs, bonus de tendance et bonus de streak.
 */
@Component({
  selector: "app-sebastian-score-card",
  standalone: true,
  template: `
    <div
      data-testid="score-card"
      class="rounded-card border border-scheme-border bg-scheme-surface p-6 shadow-xs"
    >
      <!-- Score et phase -->
      <div class="mb-4 flex items-center justify-between">
        <span class="font-heading text-h2 font-bold text-scheme-text">
          {{ score().score }}
        </span>
        <span
          class="rounded-button bg-scheme-accent/10 px-3 py-1 text-small font-semibold text-scheme-accent"
        >
          Phase {{ score().phase }}/3
        </span>
      </div>

      <!-- Decomposition du score -->
      <div class="mb-4 space-y-2">
        <!-- Adherence aux objectifs -->
        <div>
          <div
            class="mb-1 flex justify-between text-small text-scheme-text-muted"
          >
            <span>Adherence objectifs</span>
            <span>{{ score().breakdown.goalAdherence }}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-scheme-border">
            <div
              class="h-full rounded-full bg-scheme-accent transition-all duration-500"
              [style.width.%]="score().breakdown.goalAdherence"
            ></div>
          </div>
        </div>

        <!-- Bonus tendance (optionnel) -->
        @if (score().breakdown.trendBonus) {
          <div
            data-testid="trend-bonus"
            class="flex justify-between text-small text-scheme-text-muted"
          >
            <span>Bonus tendance</span>
            <span class="font-semibold text-scheme-accent">
              +{{ score().breakdown.trendBonus }}
            </span>
          </div>
        }

        <!-- Bonus streak (optionnel) -->
        @if (score().breakdown.streakBonus) {
          <div
            data-testid="streak-bonus"
            class="flex justify-between text-small text-scheme-text-muted"
          >
            <span>Bonus streak</span>
            <span class="font-semibold text-scheme-accent">
              +{{ score().breakdown.streakBonus }}
            </span>
          </div>
        }
      </div>

      <!-- Message -->
      <p class="text-small text-scheme-text-muted">
        {{ score().message }}
      </p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianScoreCardComponent {
  /** Score de sante a afficher. */
  readonly score = input.required<SebastianHealthScore>();
}
