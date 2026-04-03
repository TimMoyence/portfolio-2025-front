import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { UnitPipe } from "../../pipes/unit.pipe";
import { UnitPreferencesService } from "../../services/unit-preferences.service";
import { MetricCardComponent } from "../metric-card/metric-card.component";
import { SparklineComponent } from "../sparkline/sparkline.component";

/**
 * Carte d'humidite avec indicateur de progression circulaire CSS
 * et point de rosee. Affiche une zone de confort (sec / confortable / humide).
 */
@Component({
  selector: "app-humidity-card",
  standalone: true,
  imports: [MetricCardComponent, SparklineComponent, UnitPipe],
  template: `
    <app-metric-card
      tooltipId="humidity"
      i18n-tooltipTitle="
        weather.humidity.tooltip.title|@@weatherHumidityTooltipTitle"
      tooltipTitle="Humidité"
      i18n-tooltipContent="
        weather.humidity.tooltip.content|@@weatherHumidityTooltipContent"
      tooltipContent="L'humidité relative indique le pourcentage de vapeur d'eau dans l'air par rapport au maximum possible. Le point de rosée est la température à laquelle l'air devient saturé : plus il est proche de la température réelle, plus l'air semble moite."
    >
      <span cardTitle i18n="weather.humidity.title|@@weatherHumidityTitle"
        >Humidité</span
      >

      <div class="flex items-center gap-4">
        <!-- Indicateur circulaire -->
        <div
          class="relative h-20 w-20 flex-shrink-0"
          role="meter"
          [attr.aria-valuenow]="humidity()"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-valuetext]="humidity() + '% — ' + comfortLabel()"
        >
          <svg
            viewBox="0 0 36 36"
            class="h-full w-full -rotate-90"
            aria-hidden="true"
          >
            <!-- Fond -->
            <circle
              cx="18"
              cy="18"
              r="15.91"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              stroke-width="3"
            />
            <!-- Progression -->
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
            <span class="text-lg font-light text-white">{{ humidity() }}%</span>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <!-- Zone de confort -->
          <span [class]="'text-sm font-medium ' + comfortColor()">
            {{ comfortLabel() }}
          </span>

          <!-- Point de rosee -->
          @if (dewPoint() !== null) {
            <span class="text-sm text-white/50">
              <span i18n="weather.humidity.dewPoint|@@weatherHumidityDewPoint"
                >Point de rosée</span
              >
              : {{ dewPoint() | unit: unitService.temperatureUnit() }}
            </span>
          }
        </div>
      </div>

      @if (hourlyHumidity().length > 1) {
        <div class="mt-2">
          <app-sparkline
            [data]="hourlyHumidity()"
            [color]="'rgba(147, 197, 253, 0.8)'"
          />
        </div>
      }
    </app-metric-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HumidityCardComponent {
  /** Service de preferences d'unites. */
  readonly unitService = inject(UnitPreferencesService);

  /** Pourcentage d'humidite relative. */
  readonly humidity = input<number>(0);

  /** Temperature du point de rosee en degres Celsius. */
  readonly dewPoint = input<number | null>(null);

  /** Donnees horaires d'humidite pour le sparkline. */
  readonly hourlyHumidity = input<number[]>([]);

  /** stroke-dasharray pour l'indicateur circulaire (perimetre = 100). */
  readonly dashArray = computed(() => {
    const pct = Math.max(0, Math.min(100, this.humidity()));
    return `${pct} ${100 - pct}`;
  });

  /** Couleur de la progression circulaire selon le niveau d'humidite. */
  readonly progressColor = computed(() => {
    const h = this.humidity();
    if (h < 30) return "rgba(96,165,250,0.8)"; // bleu clair - sec
    if (h <= 60) return "rgba(74,222,128,0.8)"; // vert - confortable
    return "rgba(250,204,21,0.8)"; // jaune - humide
  });

  /** Label de zone de confort en francais. */
  readonly comfortLabel = computed(() => {
    const h = this.humidity();
    if (h < 30)
      return $localize`:weather.humidity.dry|@@weatherHumidityDry:Sec`;
    if (h <= 60)
      return $localize`:weather.humidity.comfortable|@@weatherHumidityComfortable:Confortable`;
    return $localize`:weather.humidity.humid|@@weatherHumidityHumid:Humide`;
  });

  /** Classe de couleur du label de confort. */
  readonly comfortColor = computed(() => {
    const h = this.humidity();
    if (h < 30) return "text-blue-400";
    if (h <= 60) return "text-green-400";
    return "text-yellow-400";
  });
}
