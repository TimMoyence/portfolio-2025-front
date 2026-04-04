import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from "@angular/core";
import type {
  DailyForecast,
  HourlyForecast,
} from "../../../../core/models/weather.model";
import { UnitPipe } from "../../pipes/unit.pipe";
import { UnitPreferencesService } from "../../services/unit-preferences.service";
import {
  weatherCodeToDescription,
  weatherCodeToIcon,
} from "../../utils/weather-icons";

/**
 * Panneau de detail d'un jour selectionne.
 * Utilise en inline (desktop) dans DailyForecast et dans le BottomSheet (mobile).
 * Affiche les informations detaillees : UV, vent, precipitations, lever/coucher du soleil.
 */
@Component({
  selector: "app-day-detail-panel",
  standalone: true,
  imports: [CommonModule, UnitPipe],
  template: `
    @if (dayData(); as data) {
      <div
        class="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
      >
        <!-- Header : nom du jour + date + icone -->
        <div class="mb-4 flex items-center gap-3">
          <img
            [src]="data.icon"
            [alt]="data.description"
            class="h-12 w-12 drop-shadow"
          />
          <div>
            <h4 class="text-lg font-semibold text-white">
              {{ data.dayName }}
              <span class="text-sm font-normal text-white/60">
                {{ data.dateFormatted }}
              </span>
            </h4>
            <p class="text-sm text-white/70">{{ data.description }}</p>
          </div>
        </div>

        <!-- Temperatures min/max avec gradient -->
        <div class="mb-4 flex items-center gap-3">
          <span class="text-sm text-white/50">
            {{ data.tempMin | unit: unitService.temperatureUnit() }}
          </span>
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              class="h-full rounded-full bg-gradient-to-r from-blue-400 to-orange-400"
              style="width: 100%"
            ></div>
          </div>
          <span class="text-sm font-medium text-white">
            {{ data.tempMax | unit: unitService.temperatureUnit() }}
          </span>
        </div>

        <!-- Grille de details -->
        <div class="grid grid-cols-2 gap-3">
          <!-- UV max -->
          <div class="rounded-xl border border-white/10 bg-white/5 p-3">
            <p
              class="mb-1 text-xs text-white/50"
              i18n="weather.dayDetail.uv|@@weatherDayDetailUv"
            >
              UV max
            </p>
            <p class="text-lg font-semibold text-white">
              {{ data.uvMax | number: "1.0-0" }}
            </p>
            <p class="text-xs" [ngClass]="uvRiskClass(data.uvMax)">
              {{ uvRiskLabel(data.uvMax) }}
            </p>
          </div>

          <!-- Vent max + rafales -->
          <div class="rounded-xl border border-white/10 bg-white/5 p-3">
            <p
              class="mb-1 text-xs text-white/50"
              i18n="weather.dayDetail.wind|@@weatherDayDetailWind"
            >
              Vent max
            </p>
            <p class="text-lg font-semibold text-white">
              {{ data.windMax | unit: unitService.speedUnit() }}
            </p>
            @if (data.gustsMax !== null) {
              <p class="text-xs text-white/50">
                <span i18n="weather.dayDetail.gusts|@@weatherDayDetailGusts"
                  >Rafales</span
                >
                {{ data.gustsMax | unit: unitService.speedUnit() }}
              </p>
            }
          </div>

          <!-- Precipitations -->
          <div class="rounded-xl border border-white/10 bg-white/5 p-3">
            <p
              class="mb-1 text-xs text-white/50"
              i18n="weather.dayDetail.precip|@@weatherDayDetailPrecip"
            >
              Précipitations
            </p>
            <p class="text-lg font-semibold text-white">
              {{ data.precipitationSum | number: "1.0-1" }}
              <span class="text-sm font-normal text-white/60">mm</span>
            </p>
          </div>

          <!-- Lever / coucher du soleil -->
          <div class="rounded-xl border border-white/10 bg-white/5 p-3">
            <p
              class="mb-1 text-xs text-white/50"
              i18n="weather.dayDetail.sun|@@weatherDayDetailSun"
            >
              Soleil
            </p>
            <div class="flex items-center gap-2 text-sm text-white">
              <span>↑ {{ data.sunrise }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-white/70">
              <span>↓ {{ data.sunset }}</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayDetailPanelComponent {
  /** Donnees journalieres completes. */
  readonly daily = input.required<DailyForecast>();

  /** Index du jour a afficher. */
  readonly dayIndex = input.required<number>();

  /** Donnees horaires pour filtrer sur ce jour (optionnel). */
  readonly hourly = input<HourlyForecast | null>(null);

  /** Service de preferences d'unites. */
  readonly unitService = inject(UnitPreferencesService);

  private readonly localeId = inject(LOCALE_ID);

  /** Donnees formatees du jour selectionne. */
  readonly dayData = computed(() => {
    const data = this.daily();
    const idx = this.dayIndex();
    if (!data || idx < 0 || idx >= data.time.length) return null;

    const date = new Date(data.time[idx]);
    const dayName =
      idx === 0
        ? $localize`:weather.daily.today|@@weatherDailyToday:Aujourd'hui`
        : date.toLocaleDateString(this.localeId, { weekday: "long" });

    const dateFormatted = date.toLocaleDateString(this.localeId, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const sunriseDate = new Date(data.sunrise[idx]);
    const sunsetDate = new Date(data.sunset[idx]);

    return {
      dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      dateFormatted,
      icon: weatherCodeToIcon(data.weather_code[idx]),
      description: weatherCodeToDescription(data.weather_code[idx]),
      tempMax: data.temperature_2m_max[idx],
      tempMin: data.temperature_2m_min[idx],
      uvMax: data.uv_index_max?.[idx] ?? 0,
      windMax: data.wind_speed_10m_max?.[idx] ?? 0,
      gustsMax: data.wind_gusts_10m_max?.[idx] ?? null,
      precipitationSum: data.precipitation_sum[idx],
      sunrise: sunriseDate.toLocaleTimeString(this.localeId, {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sunset: sunsetDate.toLocaleTimeString(this.localeId, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  });

  /** Retourne le label de risque UV. */
  uvRiskLabel(uvMax: number): string {
    if (uvMax <= 2) return $localize`:weather.uv.low|@@weatherUvLow:Faible`;
    if (uvMax <= 5)
      return $localize`:weather.uv.moderate|@@weatherUvModerate:Modéré`;
    if (uvMax <= 7) return $localize`:weather.uv.high|@@weatherUvHigh:Élevé`;
    if (uvMax <= 10)
      return $localize`:weather.uv.veryHigh|@@weatherUvVeryHigh:Très élevé`;
    return $localize`:weather.uv.extreme|@@weatherUvExtreme:Extrême`;
  }

  /** Retourne la classe CSS pour la couleur du risque UV. */
  uvRiskClass(uvMax: number): string {
    if (uvMax <= 2) return "text-green-400";
    if (uvMax <= 5) return "text-yellow-400";
    if (uvMax <= 7) return "text-orange-400";
    if (uvMax <= 10) return "text-red-400";
    return "text-purple-400";
  }
}
