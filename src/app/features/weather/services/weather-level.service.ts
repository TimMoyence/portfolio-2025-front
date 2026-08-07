import { computed, inject, Injectable, signal } from '@angular/core';
import { take } from 'rxjs/operators';
import type { WeatherLevel } from '../../../core/models/weather.model';
import type { WeatherPort } from '../../../core/ports/weather.port';
import { WEATHER_PORT } from '../../../core/ports/weather.port';

@Injectable()
export class WeatherLevelService {
  private readonly weatherService: WeatherPort = inject(WEATHER_PORT);

  readonly level = signal<WeatherLevel>('discovery');

  readonly daysUsed = signal(0);

  readonly tooltipsSeen = signal<string[]>([]);

  readonly loading = signal(false);

  readonly showTransitionPrompt = computed<WeatherLevel | null>(() => {
    const l = this.level();
    const d = this.daysUsed();
    if (l === 'discovery' && d >= 7) return 'curious';
    if (l === 'curious' && d >= 30) return 'expert';
    return null;
  });

  loadPreferences(): void {
    this.loading.set(true);
    this.weatherService
      .getPreferences()
      .pipe(take(1))
      .subscribe({
        next: (prefs) => {
          this.level.set(prefs.level);
          this.daysUsed.set(prefs.daysUsed);
          this.tooltipsSeen.set(prefs.tooltipsSeen);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  setLevel(level: WeatherLevel): void {
    this.level.set(level);
    this.weatherService
      .updatePreferences({ level })
      .pipe(take(1))
      .subscribe({
        next: (prefs) => {
          this.level.set(prefs.level);
        },
        error: () => {
          /* Le signal est deja mis a jour optimistiquement */
        },
      });
  }

  markTooltipSeen(tooltipId: string): void {
    const current = this.tooltipsSeen();
    if (current.includes(tooltipId)) return;

    const updated = [...current, tooltipId];
    this.tooltipsSeen.set(updated);
    this.weatherService.updatePreferences({ tooltipsSeen: updated }).pipe(take(1)).subscribe();
  }

  isTooltipSeen(tooltipId: string): boolean {
    return this.tooltipsSeen().includes(tooltipId);
  }

  recordUsage(): void {
    this.weatherService.recordUsage().pipe(take(1)).subscribe();
  }
}
