import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { UnitPipe } from '../../pipes/unit.pipe';
import { UnitPreferencesService } from '../../services/unit-preferences.service';
import { MetricCardComponent } from '../metric-card/metric-card.component';
import { SparklineComponent } from '../sparkline/sparkline.component';

@Component({
  selector: 'app-wind-compass',
  standalone: true,
  imports: [MetricCardComponent, SparklineComponent, UnitPipe],
  template: `
    <app-metric-card
      tooltipId="wind"
      i18n-tooltipTitle="weather.wind.tooltip.title|@@weatherWindTooltipTitle"
      tooltipTitle="Vent"
      i18n-tooltipContent="weather.wind.tooltip.content|@@weatherWindTooltipContent"
      tooltipContent="La vitesse du vent est mesurée à 10 m du sol. La direction indique d'où vient le vent (un vent de Nord souffle du nord vers le sud). Les rafales sont des accélérations brèves pouvant dépasser le double de la vitesse moyenne."
    >
      <span cardTitle i18n="weather.wind.title|@@weatherWindTitle">Vent</span>

      <div class="flex flex-col items-center">
        <svg viewBox="0 0 120 120" class="h-32 w-32" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            stroke-width="1.5"
          />
          <circle
            cx="60"
            cy="60"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            stroke-width="1"
          />

          <text x="60" y="14" text-anchor="middle" class="fill-white/55 font-mono text-[10px]">
            N
          </text>
          <text x="110" y="64" text-anchor="middle" class="fill-white/40 font-mono text-[10px]">
            E
          </text>
          <text x="60" y="116" text-anchor="middle" class="fill-white/40 font-mono text-[10px]">
            S
          </text>
          <text x="10" y="64" text-anchor="middle" class="fill-white/40 font-mono text-[10px]">
            O
          </text>

          <g [attr.transform]="arrowTransform()">
            <polygon points="60,22 54,46 66,46" fill="#4fb3a2" />
            <polygon points="60,98 54,74 66,74" fill="rgba(255,255,255,0.25)" />
          </g>
          <circle cx="60" cy="60" r="4" fill="#fff" />

          <text x="60" y="57" text-anchor="middle" class="fill-white font-display text-[18px]">
            {{ displaySpeedValue() }}
          </text>
          <text x="60" y="70" text-anchor="middle" class="fill-white/50 font-mono text-[8px]">
            {{ displaySpeedUnit() }}
          </text>
        </svg>

        @if (gusts() !== null) {
          <p class="mt-2 text-sm text-white/60">
            <span i18n="weather.wind.gusts|@@weatherWindGusts">Rafales</span> :
            {{ gusts()! | unit: unitService.speedUnit() }}
          </p>
        }

        <p class="mt-1 text-xs text-white/40">{{ cardinalDirection() }} ({{ direction() }}°)</p>
      </div>

      @if (hourlyWind().length > 1) {
        <div class="mt-2">
          <app-sparkline [data]="hourlyWind()" [color]="'rgba(79, 179, 162, 0.85)'" />
        </div>
      }
    </app-metric-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindCompassComponent {
  readonly unitService = inject(UnitPreferencesService);

  readonly speed = input<number>(0);

  readonly direction = input<number>(0);

  readonly gusts = input<number | null>(null);

  readonly hourlyWind = input<number[]>([]);

  readonly arrowTransform = computed(() => `rotate(${this.direction()}, 60, 60)`);

  readonly displaySpeedValue = computed(() => {
    const unit = this.unitService.speedUnit();
    const val = this.speed();
    return unit === 'mph' ? Math.round(val * 0.621371) : Math.round(val);
  });

  readonly displaySpeedUnit = computed(() => {
    return this.unitService.speedUnit() === 'mph' ? 'mph' : 'km/h';
  });

  readonly cardinalDirection = computed(() => {
    const deg = this.direction() % 360;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  });
}
