import { DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { MetricCardComponent } from "../metric-card/metric-card.component";
import { SparklineComponent } from "../sparkline/sparkline.component";

/**
 * Carte d'indice UV avec jauge coloree horizontale.
 * Echelle de 0 a 11+ avec niveaux de risque en francais.
 */
@Component({
  selector: "app-uv-index-card",
  standalone: true,
  imports: [DecimalPipe, MetricCardComponent, SparklineComponent],
  template: `
    <app-metric-card
      tooltipId="uv-index"
      i18n-tooltipTitle="weather.uv.tooltip.title|@@weatherUvTooltipTitle"
      tooltipTitle="Indice UV"
      i18n-tooltipContent="weather.uv.tooltip.content|@@weatherUvTooltipContent"
      tooltipContent="L'indice UV mesure l'intensité du rayonnement ultraviolet solaire. Plus il est élevé, plus le risque de coup de soleil est rapide. À partir de 3, crème solaire et lunettes recommandées. Au-delà de 8, limitez l'exposition entre 11h et 16h."
    >
      <span cardTitle i18n="weather.uv.title|@@weatherUvTitle">Indice UV</span>

      <div class="flex items-baseline gap-2">
        <span class="text-3xl font-light text-white">
          {{ uvIndex() | number: "1.0-0" }}
        </span>
        <span [class]="'text-sm font-medium ' + labelColor()">
          {{ riskLabel() }}
        </span>
      </div>

      <!-- Jauge horizontale a gradient -->
      <div
        class="relative mt-3 h-2 overflow-hidden rounded-full bg-white/10"
        role="meter"
        [attr.aria-valuenow]="uvIndex()"
        aria-valuemin="0"
        aria-valuemax="12"
        [attr.aria-valuetext]="riskLabel()"
      >
        <div
          class="absolute inset-0 rounded-full"
          style="background: linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444, #a855f7)"
        ></div>
        <!-- Curseur de position -->
        <div
          class="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white/90 shadow-md"
          [style.left.%]="gaugePosition()"
        ></div>
      </div>

      <div class="mt-1 flex justify-between text-xs text-white/40">
        <span>0</span>
        <span>3</span>
        <span>6</span>
        <span>8</span>
        <span>11+</span>
      </div>

      @if (hourlyUv().length > 1) {
        <div class="mt-2">
          <app-sparkline
            [data]="hourlyUv()"
            [color]="'rgba(250, 204, 21, 0.8)'"
          />
        </div>
      }
    </app-metric-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UvIndexCardComponent {
  /** Valeur de l'indice UV courant. */
  readonly uvIndex = input<number>(0);

  /** Donnees horaires d'UV pour le sparkline. */
  readonly hourlyUv = input<number[]>([]);

  /** Label de risque UV en francais selon l'echelle OMS. */
  readonly riskLabel = computed(() => {
    const uv = this.uvIndex();
    if (uv <= 2) return $localize`:weather.uv.low|@@weatherUvLow:Faible`;
    if (uv <= 5)
      return $localize`:weather.uv.moderate|@@weatherUvModerate:Modéré`;
    if (uv <= 7) return $localize`:weather.uv.high|@@weatherUvHigh:Élevé`;
    if (uv <= 10)
      return $localize`:weather.uv.veryHigh|@@weatherUvVeryHigh:Très élevé`;
    return $localize`:weather.uv.extreme|@@weatherUvExtreme:Extrême`;
  });

  /** Classe de couleur du label selon le niveau de risque. */
  readonly labelColor = computed(() => {
    const uv = this.uvIndex();
    if (uv <= 2) return "text-green-400";
    if (uv <= 5) return "text-yellow-400";
    if (uv <= 7) return "text-orange-400";
    if (uv <= 10) return "text-red-400";
    return "text-purple-400";
  });

  /** Position du curseur sur la jauge (0-100%). */
  readonly gaugePosition = computed(() => {
    const uv = this.uvIndex();
    return Math.min((uv / 12) * 100, 100);
  });
}
