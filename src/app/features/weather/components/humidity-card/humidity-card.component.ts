import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { UnitPipe } from '../../pipes/unit.pipe';
import { UnitPreferencesService } from '../../services/unit-preferences.service';
import { MetricCardComponent } from '../metric-card/metric-card.component';
import { SparklineComponent } from '../sparkline/sparkline.component';
import { clamp } from '../../../../shared/utils/math.utils';

@Component({
  selector: 'app-humidity-card',
  standalone: true,
  imports: [MetricCardComponent, SparklineComponent, UnitPipe],
  template: `
    <app-metric-card
      tooltipId="humidity"
      i18n-tooltipTitle="weather.humidity.tooltip.title|@@weatherHumidityTooltipTitle"
      tooltipTitle="Humidité"
      i18n-tooltipContent="weather.humidity.tooltip.content|@@weatherHumidityTooltipContent"
      tooltipContent="L'humidité relative indique le pourcentage de vapeur d'eau dans l'air par rapport au maximum possible. Le point de rosée est la température à laquelle l'air devient saturé : plus il est proche de la température réelle, plus l'air semble moite."
    >
      <span cardTitle i18n="weather.humidity.title|@@weatherHumidityTitle">Humidité</span>

      <div class="flex items-center gap-4">
        <div
          class="relative h-20 w-20 flex-shrink-0"
          role="meter"
          [attr.aria-valuenow]="humidity()"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-valuetext]="humidity() + '% — ' + comfortLabel()"
        >
          <svg viewBox="0 0 36 36" class="h-full w-full -rotate-90" aria-hidden="true">
            <circle
              cx="18"
              cy="18"
              r="15.91"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              stroke-width="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.91"
              fill="none"
              [attr.stroke]="progressColor()"
              stroke-width="3"
              stroke-linecap="round"
              [attr.stroke-dasharray]="dashArray()"
              stroke-dashoffset="0"
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="font-display text-xl leading-none text-white">{{ humidity() }}%</span>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <span [class]="'text-sm font-medium ' + comfortColor()">
            {{ comfortLabel() }}
          </span>

          @if (dewPoint() !== null) {
            <span class="text-sm text-white/50">
              <span i18n="weather.humidity.dewPoint|@@weatherHumidityDewPoint">Point de rosée</span>
              : {{ dewPoint() | unit: unitService.temperatureUnit() }}
            </span>
          }
        </div>
      </div>

      @if (hourlyHumidity().length > 1) {
        <div class="mt-2">
          <app-sparkline [data]="hourlyHumidity()" [color]="'rgba(143, 176, 255, 0.8)'" />
        </div>
      }
    </app-metric-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HumidityCardComponent {
  readonly unitService = inject(UnitPreferencesService);

  readonly humidity = input<number>(0);

  readonly dewPoint = input<number | null>(null);

  readonly hourlyHumidity = input<number[]>([]);

  readonly dashArray = computed(() => {
    const pct = clamp(this.humidity(), 0, 100);
    return `${pct} ${100 - pct}`;
  });

  readonly progressColor = computed(() => {
    const h = this.humidity();
    if (h < 30) return 'rgba(96,165,250,0.8)';
    if (h <= 60) return 'rgba(74,222,128,0.8)';
    return 'rgba(250,204,21,0.8)';
  });

  readonly comfortLabel = computed(() => {
    const h = this.humidity();
    if (h < 30) return $localize`:weather.humidity.dry|@@weatherHumidityDry:Sec`;
    if (h <= 60)
      return $localize`:weather.humidity.comfortable|@@weatherHumidityComfortable:Confortable`;
    return $localize`:weather.humidity.humid|@@weatherHumidityHumid:Humide`;
  });

  readonly comfortColor = computed(() => {
    const h = this.humidity();
    if (h < 30) return 'text-blue-400';
    if (h <= 60) return 'text-green-400';
    return 'text-yellow-400';
  });
}
