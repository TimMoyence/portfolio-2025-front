import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import type { CurrentWeather, DetailedCurrentWeather } from '../../../../core/models/weather.model';
import { UnitPipe } from '../../pipes/unit.pipe';
import { UnitPreferencesService } from '../../services/unit-preferences.service';
import { animateValue, type AnimationHandle } from '../../../../shared/utils/animate-value';
import { weatherCodeToDescription, weatherCodeToIcon } from '../../utils/weather-icons';

@Component({
  selector: 'app-current-conditions',
  standalone: true,
  imports: [CommonModule, UnitPipe],
  styles: `
    @keyframes countUp {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    .temp-count-up {
      animation: countUp 0.5s ease-out;
    }
  `,
  template: `
    @if (current()) {
      <div class="rounded-[20px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
        <div class="flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:gap-8">
          <div class="flex flex-col items-center sm:items-start">
            <p
              class="font-display text-7xl font-normal leading-none text-white sm:text-8xl temp-count-up"
            >
              {{ animatedTemp() | unit: unitService.temperatureUnit() }}
            </p>
            <div
              class="mt-3 flex flex-wrap gap-4 font-mono text-xs uppercase tracking-wider text-white/60"
            >
              <span i18n="weather.current.feelsLike|@@weatherCurrentFeelsLike">
                Ressenti
                <b class="font-medium text-white">{{
                  current()!.apparent_temperature | unit: unitService.temperatureUnit()
                }}</b>
              </span>
              <span i18n="weather.current.wind|@@weatherCurrentWind">
                Vent
                <b class="font-medium text-white">{{
                  current()!.wind_speed_10m | unit: unitService.speedUnit()
                }}</b>
              </span>
            </div>
          </div>

          <div class="flex flex-col items-center gap-1 sm:ml-auto sm:items-end">
            <img [src]="icon()" [alt]="description()" class="h-16 w-16 drop-shadow-lg" />
            <p class="text-base text-white/80">{{ description() }}</p>
          </div>
        </div>

        @if (detailed(); as detail) {
          <div class="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
            @if (detail.precipitationProbability > 0 || detail.rain1h > 0) {
              <div class="text-center">
                <p
                  class="font-mono text-[10px] uppercase tracking-wider text-white/50"
                  i18n="weather.current.precip|@@weatherCurrentPrecip"
                >
                  Pluie
                </p>
                <p class="mt-1 text-sm font-medium text-teal">
                  @if (detail.rain1h > 0) {
                    {{ detail.rain1h | number: '1.0-1' }}mm/h
                  } @else {
                    {{ detail.precipitationProbability | number: '1.0-0' }}%
                  }
                </p>
              </div>
            }
            <div class="text-center">
              <p
                class="font-mono text-[10px] uppercase tracking-wider text-white/50"
                i18n="weather.current.humidity|@@weatherCurrentHumidity"
              >
                Humidité
              </p>
              <p class="mt-1 text-sm font-medium text-white">{{ detail.humidity }}%</p>
            </div>
            <div class="text-center">
              <p
                class="font-mono text-[10px] uppercase tracking-wider text-white/50"
                i18n="weather.current.visibility|@@weatherCurrentVisibility"
              >
                Visibilité
              </p>
              <p class="mt-1 text-sm font-medium text-white">{{ detail.visibility }} km</p>
            </div>
          </div>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentConditionsComponent {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private animHandle: AnimationHandle | null = null;

  readonly unitService = inject(UnitPreferencesService);

  readonly current = input<CurrentWeather | null>(null);

  readonly detailed = input<DetailedCurrentWeather | null>(null);

  readonly animatedTemp = signal(0);

  readonly icon = computed(() => {
    const data = this.current();
    if (!data) return '';
    return weatherCodeToIcon(data.weather_code);
  });

  readonly description = computed(() => {
    const data = this.current();
    if (!data) return '';
    return weatherCodeToDescription(data.weather_code);
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.animHandle?.cancel());

    effect(() => {
      const data = this.current();
      if (!data) return;
      this.animateCountUp(data.temperature_2m);
    });
  }

  private animateCountUp(target: number): void {
    if (!this.isBrowser || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.animatedTemp.set(target);
      return;
    }

    this.animHandle?.cancel();

    const start = this.animatedTemp();
    this.animHandle = animateValue({
      from: start,
      to: target,
      durationMs: 500,
      onFrame: (v) => this.animatedTemp.set(v),
      onComplete: () => {
        this.animHandle = null;
      },
    });
  }
}
