import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { animateValue } from '../../shared/utils/animate-value';
import {
  buildDeterministicHeatmap,
  buildRandomHeatmap,
  gaugeOffset,
} from '../../shared/demos/sebastian-gauge';
import {
  MOCK_BAC,
  MOCK_BADGES,
  MOCK_DAILY_COUNTS,
  MOCK_HEALTH_SCORE,
  MOCK_HEATMAP,
  MOCK_TRENDS,
} from './sebastian-presentation-data';

interface DemoHabit {
  readonly id: string;
  readonly label: string;
  readonly weight: number;
}

@Component({
  selector: 'app-sebastian-presentation',
  standalone: true,
  imports: [RouterModule, RevealOnScrollDirective],
  templateUrl: './sebastian-presentation.component.html',
  styleUrl: './sebastian-presentation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianPresentationComponent {
  private readonly platformId = inject(PLATFORM_ID);

  readonly healthScore = MOCK_HEALTH_SCORE;

  readonly bac = MOCK_BAC;

  readonly badges = MOCK_BADGES;

  readonly trends = MOCK_TRENDS;

  readonly heatmapData = MOCK_HEATMAP;

  readonly dailyCounts = MOCK_DAILY_COUNTS;

  readonly habits: readonly DemoHabit[] = [
    {
      id: 'hydration',
      label: $localize`:@@sebastianLandingHabitHydration:💧 Hydratation`,
      weight: 22,
    },
    {
      id: 'sleep',
      label: $localize`:@@sebastianLandingHabitSleep:🌙 Sommeil 7h+`,
      weight: 18,
    },
    {
      id: 'moderation',
      label: $localize`:@@sebastianLandingHabitModeration:🚫 Pas d'excès`,
      weight: 32,
    },
    {
      id: 'activity',
      label: $localize`:@@sebastianLandingHabitActivity:🏃 Activité`,
      weight: 16,
    },
  ];

  readonly checkedHabits = signal<ReadonlySet<string>>(
    new Set(['hydration', 'sleep', 'moderation']),
  );

  readonly targetScore = computed(() => {
    const checked = this.checkedHabits();
    const sum = this.habits.reduce((acc, h) => (checked.has(h.id) ? acc + h.weight : acc), 0);
    return Math.min(100, sum);
  });

  readonly streak = computed(() => {
    const missing = this.habits.length - this.checkedHabits().size;
    return Math.max(0, 12 - missing);
  });

  readonly gaugeValue = signal<number>(0);

  readonly gaugeOffset = computed(() => gaugeOffset(this.gaugeValue()));

  private hasAnimated = false;

  readonly heatmap = signal<number[]>(buildDeterministicHeatmap(56, 0.32));

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.animateGauge();
      this.heatmap.set(buildRandomHeatmap(56, 0.32));
    } else {
      this.gaugeValue.set(this.targetScore());
    }
  }

  toggleHabit(id: string): void {
    const next = new Set(this.checkedHabits());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.checkedHabits.set(next);
    if (this.hasAnimated || !isPlatformBrowser(this.platformId)) {
      this.gaugeValue.set(this.targetScore());
    }
  }

  isChecked(id: string): boolean {
    return this.checkedHabits().has(id);
  }

  private animateGauge(): void {
    const target = this.targetScore();
    animateValue({
      from: 0,
      to: target,
      durationMs: 1500,
      onFrame: (v) => this.gaugeValue.set(Math.round(v)),
      onComplete: () => {
        this.hasAnimated = true;
      },
    });
  }
}
