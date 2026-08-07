import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { SebastianHealthScore } from '../../../core/models/sebastian.model';

@Component({
  selector: 'app-sebastian-score-card',
  standalone: true,
  template: `
    <div
      data-testid="score-card"
      class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-6"
    >
      <div class="mb-4 flex items-center justify-between">
        <span class="font-display text-5xl leading-none text-white">
          {{ score().score }}
        </span>
        <span
          class="rounded-full bg-[rgba(230,170,70,0.16)] px-3 py-1 font-mono text-xs uppercase tracking-[0.08em] text-gold-soft"
        >
          Phase {{ score().phase }}/3
        </span>
      </div>

      <div class="mb-4 space-y-2">
        <div>
          <div class="mb-1 flex justify-between text-sm text-white/70">
            <span>Adherence objectifs</span>
            <span class="font-mono text-gold-soft">{{ score().breakdown.goalAdherence }}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
            <div
              class="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft transition-all duration-500"
              [style.width.%]="score().breakdown.goalAdherence"
            ></div>
          </div>
        </div>

        @if (score().breakdown.trendBonus) {
          <div data-testid="trend-bonus" class="flex justify-between text-sm text-white/70">
            <span>Bonus tendance</span>
            <span class="font-semibold text-gold-soft"> +{{ score().breakdown.trendBonus }} </span>
          </div>
        }

        @if (score().breakdown.streakBonus) {
          <div data-testid="streak-bonus" class="flex justify-between text-sm text-white/70">
            <span>Bonus streak</span>
            <span class="font-semibold text-gold-soft"> +{{ score().breakdown.streakBonus }} </span>
          </div>
        }
      </div>

      <p class="text-sm text-white/55">
        {{ score().message }}
      </p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianScoreCardComponent {
  readonly score = input.required<SebastianHealthScore>();
}
