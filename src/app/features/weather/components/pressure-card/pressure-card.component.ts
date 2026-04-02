import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { MetricCardComponent } from "../metric-card/metric-card.component";

/**
 * Carte de pression atmospherique avec tendance calculee
 * a partir des donnees horaires si disponibles.
 */
@Component({
  selector: "app-pressure-card",
  standalone: true,
  imports: [MetricCardComponent],
  template: `
    <app-metric-card
      tooltipId="pressure"
      i18n-tooltipTitle="
        weather.pressure.tooltip.title|@@weatherPressureTooltipTitle"
      tooltipTitle="Pression atmosphérique"
      i18n-tooltipContent="
        weather.pressure.tooltip.content|@@weatherPressureTooltipContent"
      tooltipContent="La pression atmosphérique est le poids de l'air au-dessus de vous, mesurée en hectopascals (hPa). Une pression en hausse annonce généralement du beau temps, une baisse rapide signale l'arrivée d'une perturbation."
      [unavailable]="pressure() === null"
    >
      <span cardTitle i18n="weather.pressure.title|@@weatherPressureTitle"
        >Pression atmosphérique</span
      >

      <div class="flex items-baseline gap-2">
        <span class="text-3xl font-light text-white">
          {{ pressure() }}
        </span>
        <span class="text-sm text-white/70">hPa</span>
        <span class="text-lg" [class]="trendColor()">
          {{ trendArrow() }}
        </span>
      </div>

      <p class="mt-2 text-sm text-white/50">
        {{ trendDescription() }}
      </p>
    </app-metric-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PressureCardComponent {
  /** Pression courante en hPa. */
  readonly pressure = input<number | null>(null);

  /** Tableau horaire de pression pour calculer la tendance. */
  readonly hourlyPressure = input<number[] | null>(null);

  /**
   * Tendance de pression calculee a partir des 3 dernieres heures.
   * Retourne 'rising', 'falling' ou 'stable'.
   */
  readonly trend = computed<"rising" | "falling" | "stable">(() => {
    const hourly = this.hourlyPressure();
    if (!hourly || hourly.length < 4) return "stable";
    const recent = hourly.slice(-3);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];
    const diff = newest - oldest;
    if (diff > 1) return "rising";
    if (diff < -1) return "falling";
    return "stable";
  });

  /** Fleche directionnelle de la tendance. */
  readonly trendArrow = computed(() => {
    const t = this.trend();
    if (t === "rising") return "↑";
    if (t === "falling") return "↓";
    return "→";
  });

  /** Classe de couleur de la tendance. */
  readonly trendColor = computed(() => {
    const t = this.trend();
    if (t === "rising") return "text-green-400";
    if (t === "falling") return "text-red-400";
    return "text-white/50";
  });

  /** Description textuelle de la tendance de pression. */
  readonly trendDescription = computed(() => {
    const t = this.trend();
    if (t === "rising")
      return $localize`:weather.pressure.rising|@@weatherPressureRising:En hausse`;
    if (t === "falling")
      return $localize`:weather.pressure.falling|@@weatherPressureFalling:En baisse`;
    return $localize`:weather.pressure.stable|@@weatherPressureStable:Stable`;
  });
}
