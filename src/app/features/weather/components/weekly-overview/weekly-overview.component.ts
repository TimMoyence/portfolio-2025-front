import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import type {
  HourlyForecast,
  OverviewGranularity,
} from "../../../../core/models/weather.model";
import { UnitPipe } from "../../pipes/unit.pipe";
import { UnitPreferencesService } from "../../services/unit-preferences.service";
import {
  groupHourlyByGranularity,
  type WeatherTimeSlot,
} from "../../utils/weekly-overview";
import { weatherCodeToIcon } from "../../utils/weather-icons";

/**
 * Vue d'ensemble hebdomadaire avec granularite configurable.
 * Affiche les donnees horaires groupees par jour, 3h ou 1h
 * selon la preference de l'utilisateur.
 */
@Component({
  selector: "app-weekly-overview",
  standalone: true,
  imports: [CommonModule, UnitPipe],
  template: `
    <div
      class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md"
    >
      <!-- Header avec titre et selecteur de granularite -->
      <div class="mb-4 flex items-center justify-between">
        <h3
          class="text-lg font-semibold text-white"
          i18n="weather.overview.title|@@weatherOverviewTitle"
        >
          Vue d'ensemble
        </h3>

        <nav
          class="inline-flex rounded-xl border border-white/20 bg-white/10 p-0.5 backdrop-blur-md"
          role="tablist"
          aria-label="Granularité de la vue d'ensemble"
          i18n-aria-label="
            weather.overview.granularity.aria|@@weatherOverviewGranularityAria"
        >
          @for (option of granularityOptions; track option.value) {
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="granularity() === option.value"
              class="rounded-lg px-3 py-1 text-xs font-medium transition-all"
              [ngClass]="
                granularity() === option.value
                  ? 'bg-white/25 text-white shadow-sm'
                  : 'text-white/60 hover:text-white/80'
              "
              (click)="setGranularity(option.value)"
            >
              {{ option.label }}
            </button>
          }
        </nav>
      </div>

      <!-- Liste des creneaux -->
      @if (slots().length > 0) {
        <div
          class="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/20"
        >
          @for (slot of slots(); track slot.label) {
            <div
              class="flex flex-shrink-0 snap-center flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 p-3 min-w-[100px] transition-all hover:bg-white/10"
            >
              <span class="text-xs font-medium text-white/80">
                {{ formatLabel(slot) }}
              </span>
              <img
                [src]="weatherCodeToIcon(slot.dominantWeatherCode)"
                [alt]="formatLabel(slot)"
                class="h-8 w-8 drop-shadow"
              />
              <div class="flex flex-col items-center gap-0.5 text-xs">
                <span class="font-medium text-white">
                  {{ slot.maxTemp | unit: unitService.temperatureUnit() }}
                </span>
                @if (slot.hourCount > 1) {
                  <span class="text-white/50">
                    {{ slot.minTemp | unit: unitService.temperatureUnit() }}
                  </span>
                }
              </div>
              @if (slot.totalPrecipitation > 0) {
                <span class="text-[10px] text-blue-300">
                  {{ slot.totalPrecipitation | number: "1.0-1" }}mm
                </span>
              }
              <span class="text-[10px] text-white/40">
                {{ slot.maxWind | number: "1.0-0" }} km/h
              </span>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyOverviewComponent {
  /** Donnees horaires brutes a grouper. */
  readonly hourly = input<HourlyForecast | null>(null);

  /** Granularite initiale (synchronisee depuis les preferences). */
  readonly initialGranularity = input<OverviewGranularity>("day");

  /** Emis quand l'utilisateur change la granularite. */
  readonly granularityChange = output<OverviewGranularity>();

  /** Granularite actuelle selectionnee. */
  readonly granularity = signal<OverviewGranularity>("day");

  readonly unitService = inject(UnitPreferencesService);

  /** Options de granularite affichees dans le selecteur. */
  readonly granularityOptions: { value: OverviewGranularity; label: string }[] =
    [
      { value: "day", label: "Jour" },
      { value: "3h", label: "3h" },
      { value: "1h", label: "1h" },
    ];

  /** Creneaux calcules a partir des donnees horaires et de la granularite. */
  readonly slots = computed<WeatherTimeSlot[]>(() => {
    const h = this.hourly();
    if (!h) return [];
    return groupHourlyByGranularity(h, this.granularity());
  });

  /** Expose weatherCodeToIcon pour le template. */
  readonly weatherCodeToIcon = weatherCodeToIcon;

  /** Change la granularite et emet l'evenement. */
  setGranularity(value: OverviewGranularity): void {
    if (this.granularity() === value) return;
    this.granularity.set(value);
    this.granularityChange.emit(value);
  }

  /** Formate le label d'un creneau pour l'affichage. */
  formatLabel(slot: WeatherTimeSlot): string {
    const g = this.granularity();
    if (g === "day") {
      const date = new Date(slot.label);
      return date.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
      });
    }
    // 3h ou 1h : afficher l'heure
    const time = slot.label.slice(11, 16); // "HH:mm"
    return time;
  }
}
