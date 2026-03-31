import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from "@angular/core";
import type { DailyForecast } from "../../../../core/models/weather.model";
import { weatherCodeToIcon } from "../../utils/weather-icons";

/** Representation d'une journee pour l'affichage dans le template. */
interface DayItem {
  dayName: string;
  icon: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
}

/**
 * Composant d'affichage des previsions journalieres.
 * Affiche une liste de 7 jours avec icone, temperatures et precipitations.
 */
@Component({
  selector: "app-daily-forecast",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md"
    >
      <h3
        class="mb-4 text-lg font-semibold text-white"
        i18n="weather.daily.title|@@weatherDailyTitle"
      >
        Prévisions sur 7 jours
      </h3>

      <div class="divide-y divide-white/10">
        @for (day of days(); track day.dayName) {
          <div class="flex items-center justify-between py-3">
            <span class="w-24 text-sm font-medium text-white">
              {{ day.dayName }}
            </span>

            <img
              [src]="day.icon"
              [alt]="day.dayName"
              class="h-8 w-8 drop-shadow"
            />

            <div class="flex items-center gap-3 text-sm">
              @if (day.precipitationSum > 0) {
                <span class="text-blue-300">
                  {{ day.precipitationSum | number: "1.0-1" }}mm
                </span>
              }
              <span class="text-white/50">
                {{ day.tempMin | number: "1.0-0" }}°
              </span>
              <div class="h-1 w-16 overflow-hidden rounded-full bg-white/20">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-blue-400 to-orange-400"
                  [style.width.%]="tempBarWidth(day)"
                ></div>
              </div>
              <span class="font-medium text-white">
                {{ day.tempMax | number: "1.0-0" }}°
              </span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyForecastComponent {
  /** Donnees de prevision journaliere. */
  readonly daily = input<DailyForecast | null>(null);
  private readonly localeId = inject(LOCALE_ID);

  /** Liste formatee des jours a afficher. */
  readonly days = computed<DayItem[]>(() => {
    const data = this.daily();
    if (!data) return [];

    return data.time.slice(0, 7).map((time, i) => {
      const date = new Date(time);
      const dayName =
        i === 0
          ? $localize`:weather.daily.today|@@weatherDailyToday:Aujourd'hui`
          : date.toLocaleDateString(this.localeId, { weekday: "long" });

      return {
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        icon: weatherCodeToIcon(data.weather_code[i]),
        tempMax: data.temperature_2m_max[i],
        tempMin: data.temperature_2m_min[i],
        precipitationSum: data.precipitation_sum[i],
      };
    });
  });

  /** Calcule la largeur de la barre de temperature en pourcentage. */
  tempBarWidth(day: DayItem): number {
    const allDays = this.days();
    if (allDays.length === 0) return 50;

    const allMin = Math.min(...allDays.map((d) => d.tempMin));
    const allMax = Math.max(...allDays.map((d) => d.tempMax));
    const range = allMax - allMin;
    if (range === 0) return 50;

    return ((day.tempMax - allMin) / range) * 100;
  }
}
