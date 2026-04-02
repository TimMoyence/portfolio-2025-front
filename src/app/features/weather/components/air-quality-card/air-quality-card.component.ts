import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import type { AirQualityData } from "../../../../core/models/weather.model";
import { MetricCardComponent } from "../metric-card/metric-card.component";

/**
 * Carte de qualite de l'air avec indice AQI europeen et polluants principaux.
 * Echelle de 0 a 100+ avec 6 niveaux de qualite en francais.
 */
@Component({
  selector: "app-air-quality-card",
  standalone: true,
  imports: [CommonModule, MetricCardComponent],
  template: `
    <app-metric-card
      tooltipId="air-quality"
      i18n-tooltipTitle="weather.aqi.tooltip.title|@@weatherAqiTooltipTitle"
      tooltipTitle="Qualité de l'air"
      i18n-tooltipContent="
        weather.aqi.tooltip.content|@@weatherAqiTooltipContent"
      tooltipContent="L'indice AQI européen combine les niveaux de particules fines (PM2.5, PM10) et d'ozone (O₃). En dessous de 20 l'air est bon, au-dessus de 60 les personnes sensibles doivent limiter les efforts en extérieur."
      [unavailable]="!airQuality()"
    >
      <span cardTitle i18n="weather.aqi.title|@@weatherAqiTitle"
        >Qualité de l'air</span
      >

      @if (airQuality(); as aq) {
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-light text-white">
            {{ aq.current.european_aqi }}
          </span>
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            [ngClass]="badgeClasses()"
          >
            {{ qualityLabel() }}
          </span>
        </div>

        <!-- Polluants principaux -->
        <div class="mt-3 flex flex-wrap gap-2">
          <span
            class="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70"
          >
            PM2.5 : {{ aq.current.pm2_5 | number: "1.0-1" }} µg/m³
          </span>
          <span
            class="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70"
          >
            PM10 : {{ aq.current.pm10 | number: "1.0-1" }} µg/m³
          </span>
          <span
            class="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70"
          >
            O₃ : {{ aq.current.ozone | number: "1.0-1" }} µg/m³
          </span>
        </div>
      }
    </app-metric-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AirQualityCardComponent {
  /** Donnees de qualite de l'air. */
  readonly airQuality = input<AirQualityData | null>(null);

  /** Label de qualite de l'air en francais selon l'echelle AQI europeenne. */
  readonly qualityLabel = computed(() => {
    const aq = this.airQuality();
    if (!aq) return "";
    const aqi = aq.current.european_aqi;
    if (aqi <= 20) return $localize`:weather.aqi.good|@@weatherAqiGood:Bon`;
    if (aqi <= 40) return $localize`:weather.aqi.fair|@@weatherAqiFair:Correct`;
    if (aqi <= 60)
      return $localize`:weather.aqi.moderate|@@weatherAqiModerate:Modéré`;
    if (aqi <= 80) return $localize`:weather.aqi.poor|@@weatherAqiPoor:Mauvais`;
    if (aqi <= 100)
      return $localize`:weather.aqi.veryPoor|@@weatherAqiVeryPoor:Très mauvais`;
    return $localize`:weather.aqi.extremelyPoor|@@weatherAqiExtremelyPoor:Extrêmement mauvais`;
  });

  /** Classes CSS du badge de couleur selon le niveau AQI. */
  readonly badgeClasses = computed(() => {
    const aq = this.airQuality();
    if (!aq) return "";
    const aqi = aq.current.european_aqi;
    if (aqi <= 20) return "bg-green-500/20 text-green-300";
    if (aqi <= 40) return "bg-yellow-500/20 text-yellow-300";
    if (aqi <= 60) return "bg-orange-500/20 text-orange-300";
    if (aqi <= 80) return "bg-red-500/20 text-red-300";
    if (aqi <= 100) return "bg-purple-500/20 text-purple-300";
    return "bg-gray-700/40 text-gray-300";
  });
}
