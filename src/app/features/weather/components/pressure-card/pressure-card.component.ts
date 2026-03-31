import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

/**
 * Carte de pression atmospherique avec tendance calculee
 * a partir des donnees horaires si disponibles.
 */
@Component({
  selector: "app-pressure-card",
  standalone: true,
  template: `
    <div
      class="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
    >
      <h3
        class="mb-3 text-sm font-medium text-white/70"
        i18n="weather.pressure.title|@@weatherPressureTitle"
      >
        Pression atmosphérique
      </h3>

      @if (pressure() !== null) {
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
      } @else {
        <p
          class="text-sm text-white/40"
          i18n="weather.pressure.unavailable|@@weatherPressureUnavailable"
        >
          Données indisponibles
        </p>
      }
    </div>
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
