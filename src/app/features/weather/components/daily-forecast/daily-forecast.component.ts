import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  output,
  signal,
} from "@angular/core";
import { BreakpointService } from "../../../../core/services/breakpoint.service";
import type {
  DailyForecast,
  HourlyForecast,
} from "../../../../core/models/weather.model";
import { UnitPipe } from "../../pipes/unit.pipe";
import { UnitPreferencesService } from "../../services/unit-preferences.service";
import { DayDetailPanelComponent } from "../day-detail-panel/day-detail-panel.component";
import { weatherCodeToIcon } from "../../utils/weather-icons";

/** Representation d'une journee pour l'affichage dans le template. */
interface DayItem {
  dayName: string;
  dateFormatted: string;
  icon: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  index: number;
}

/**
 * Composant d'affichage des previsions journalieres.
 * Affiche une liste verticale (desktop) ou des cartes horizontales swipables (mobile).
 * Permet de basculer entre 7 et 14 jours et d'ouvrir le detail d'un jour.
 */
@Component({
  selector: "app-daily-forecast",
  standalone: true,
  imports: [CommonModule, DayDetailPanelComponent, UnitPipe],
  template: `
    <div
      class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md"
    >
      <!-- Header avec titre et toggle 7j/14j -->
      <div class="mb-4 flex items-center justify-between">
        <h3
          class="text-lg font-semibold text-white"
          i18n="weather.daily.title|@@weatherDailyTitle"
        >
          Prévisions journalières
        </h3>

        <!-- Selecteur segmente 7j / 14j -->
        <nav
          class="inline-flex rounded-xl border border-white/20 bg-white/10 p-0.5 backdrop-blur-md"
          role="tablist"
          aria-label="Nombre de jours de prévisions"
          i18n-aria-label="weather.daily.toggle.aria|@@weatherDailyToggleAria"
        >
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="forecastDays() === 7"
            class="rounded-lg px-3 py-1 text-xs font-medium transition-all"
            [ngClass]="
              forecastDays() === 7
                ? 'bg-white/25 text-white shadow-sm'
                : 'text-white/60 hover:text-white/80'
            "
            (click)="setForecastDays(7)"
            i18n="weather.daily.7days|@@weatherDaily7Days"
          >
            7 jours
          </button>
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="forecastDays() === 14"
            class="rounded-lg px-3 py-1 text-xs font-medium transition-all"
            [ngClass]="
              forecastDays() === 14
                ? 'bg-white/25 text-white shadow-sm'
                : 'text-white/60 hover:text-white/80'
            "
            (click)="setForecastDays(14)"
            i18n="weather.daily.14days|@@weatherDaily14Days"
          >
            14 jours
          </button>
        </nav>
      </div>

      <!-- Mobile : cartes horizontales swipables -->
      @if (isMobile()) {
        <div
          class="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/20"
        >
          @for (day of days(); track day.index) {
            <button
              type="button"
              class="flex flex-shrink-0 snap-center flex-col items-center gap-1.5 rounded-xl border p-3 min-w-[120px] transition-all"
              [ngClass]="
                selectedDayIndex() === day.index
                  ? 'border-white/40 bg-white/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              "
              (click)="onDayClick(day.index)"
            >
              <span class="text-xs font-medium text-white/80">
                {{ day.dayName }}
              </span>
              <img
                [src]="day.icon"
                [alt]="day.dayName"
                class="h-8 w-8 drop-shadow"
              />
              <div class="flex items-center gap-1 text-xs">
                <span class="text-white/50">
                  {{ day.tempMin | unit: unitService.temperatureUnit() }}
                </span>
                <span class="font-medium text-white">
                  {{ day.tempMax | unit: unitService.temperatureUnit() }}
                </span>
              </div>
              @if (day.precipitationSum > 0) {
                <span class="text-[10px] text-blue-300">
                  {{ day.precipitationSum | number: "1.0-1" }}mm
                </span>
              }
            </button>
          }
        </div>
      } @else {
        <!-- Desktop : liste verticale avec expand panel -->
        <div class="divide-y divide-white/10">
          @for (day of days(); track day.index) {
            <div>
              <button
                type="button"
                class="flex w-full items-center justify-between py-3 transition-colors hover:bg-white/5 rounded-lg px-2"
                [ngClass]="
                  selectedDayIndex() === day.index ? 'bg-white/10' : ''
                "
                (click)="onDayClick(day.index)"
              >
                <span class="w-24 text-sm font-medium text-white text-left">
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
                    {{ day.tempMin | unit: unitService.temperatureUnit() }}
                  </span>
                  <div
                    class="h-1 w-16 overflow-hidden rounded-full bg-white/20"
                  >
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-blue-400 to-orange-400"
                      [style.width.%]="tempBarWidth(day)"
                    ></div>
                  </div>
                  <span class="font-medium text-white">
                    {{ day.tempMax | unit: unitService.temperatureUnit() }}
                  </span>
                </div>
              </button>

              <!-- Desktop expand panel -->
              @if (selectedDayIndex() === day.index && daily()) {
                <div class="px-2 pb-3">
                  <app-day-detail-panel
                    [daily]="daily()!"
                    [dayIndex]="day.index"
                    [hourly]="hourly()"
                  />
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyForecastComponent {
  /** Donnees de prevision journaliere. */
  readonly daily = input<DailyForecast | null>(null);

  /** Donnees horaires pour le detail du jour selectionne. */
  readonly hourly = input<HourlyForecast | null>(null);

  /** Index du jour actuellement selectionne. */
  readonly selectedDayIndex = input<number | null>(null);

  /** Emis quand un jour est clique. */
  readonly daySelected = output<number>();

  /** Emis quand le nombre de jours de prevision change. */
  readonly forecastDaysChange = output<number>();

  /** Nombre de jours de prevision affiches (7 ou 14). */
  readonly forecastDays = signal<7 | 14>(7);

  /** Service de preferences d'unites. */
  readonly unitService = inject(UnitPreferencesService);

  private readonly localeId = inject(LOCALE_ID);
  private readonly breakpointService = inject(BreakpointService);

  /** Detecte si on est en mode mobile (< 768px). Delegue au BreakpointService. */
  readonly isMobile = this.breakpointService.isMobile;

  /** Liste formatee des jours a afficher. */
  readonly days = computed<DayItem[]>(() => {
    const data = this.daily();
    if (!data) return [];

    const count = Math.min(this.forecastDays(), data.time.length);

    return data.time.slice(0, count).map((time, i) => {
      const date = new Date(time);
      const dayName =
        i === 0
          ? $localize`:weather.daily.today|@@weatherDailyToday:Aujourd'hui`
          : date.toLocaleDateString(this.localeId, { weekday: "long" });

      const dateFormatted = date.toLocaleDateString(this.localeId, {
        day: "numeric",
        month: "short",
      });

      return {
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        dateFormatted,
        icon: weatherCodeToIcon(data.weather_code[i]),
        tempMax: data.temperature_2m_max[i],
        tempMin: data.temperature_2m_min[i],
        precipitationSum: data.precipitation_sum[i],
        index: i,
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

  /** Met a jour le nombre de jours et emet l'evenement au parent. */
  setForecastDays(days: 7 | 14): void {
    if (this.forecastDays() === days) return;
    this.forecastDays.set(days);
    this.forecastDaysChange.emit(days);
  }

  /** Gere le clic sur un jour. */
  onDayClick(index: number): void {
    this.daySelected.emit(index);
  }
}
