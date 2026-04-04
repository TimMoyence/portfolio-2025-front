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
import type {
  DailyForecast,
  HourlyForecast,
  OverviewGranularity,
  WeatherLevel,
} from "../../../../core/models/weather.model";
import { UnitPipe } from "../../pipes/unit.pipe";
import { UnitPreferencesService } from "../../services/unit-preferences.service";
import {
  groupHourlyByGranularity,
  type WeatherTimeSlot,
} from "../../utils/weekly-overview";
import { weatherCodeToIcon } from "../../utils/weather-icons";

/** Ligne affichee dans le tableau pour le mode "day". */
interface DayRow {
  dayLabel: string;
  icon: string;
  tempMin: number;
  tempMax: number;
  precipitationSum: number;
  windMax: number;
  gustsMax: number | null;
  windDir: number | null;
  humidity: number | null;
  pressure: number | null;
}

/** Groupe de lignes 3h/1h rattachees a un meme jour. */
interface SlotGroup {
  dayLabel: string;
  slots: WeatherTimeSlot[];
}

/**
 * Tableau de previsions unifie avec design glassmorphism.
 * Remplace daily-forecast + ancien weekly-overview.
 * Colonnes progressives selon le niveau (discovery → curious → expert).
 */
@Component({
  selector: "app-weekly-overview",
  standalone: true,
  imports: [CommonModule, UnitPipe],
  templateUrl: "./weekly-overview.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyOverviewComponent {
  /** Donnees horaires brutes a grouper. */
  readonly hourly = input<HourlyForecast | null>(null);

  /** Donnees journalieres pour le mode "Jour". */
  readonly daily = input<DailyForecast | null>(null);

  /** Niveau d'experience de l'utilisateur. */
  readonly level = input<WeatherLevel>("discovery");

  /** Granularite initiale (synchronisee depuis les preferences). */
  readonly initialGranularity = input<OverviewGranularity>("day");

  /** Emis quand l'utilisateur change la granularite. */
  readonly granularityChange = output<OverviewGranularity>();

  /** Granularite actuelle selectionnee. */
  readonly granularity = signal<OverviewGranularity>("day");

  readonly unitService = inject(UnitPreferencesService);
  private readonly localeId = inject(LOCALE_ID);

  /** Options de granularite. */
  readonly granularityOptions: { value: OverviewGranularity; label: string }[] =
    [
      { value: "day", label: "Jour" },
      { value: "3h", label: "3h" },
      { value: "1h", label: "1h" },
    ];

  /** Expose weatherCodeToIcon pour le template. */
  readonly weatherCodeToIcon = weatherCodeToIcon;

  /** Niveau curious ou expert. */
  readonly isCurious = computed(
    () => this.level() === "curious" || this.level() === "expert",
  );

  /** Niveau expert. */
  readonly isExpert = computed(() => this.level() === "expert");

  /** Creneaux horaires groupes (pour modes 3h/1h). */
  readonly slots = computed<WeatherTimeSlot[]>(() => {
    const h = this.hourly();
    if (!h) return [];
    return groupHourlyByGranularity(h, this.granularity());
  });

  /** Lignes du tableau en mode "Jour" (depuis DailyForecast). */
  readonly dayRows = computed<DayRow[]>(() => {
    const d = this.daily();
    const h = this.hourly();
    if (!d) return [];

    const hourlyByDay = h ? groupHourlyByGranularity(h, "day") : [];

    return d.time.map((time, i) => {
      const date = new Date(time);
      const dayLabel =
        i === 0
          ? $localize`:weather.daily.today|@@weatherDailyToday:Aujourd'hui`
          : date.toLocaleDateString(this.localeId, {
              weekday: "short",
              day: "numeric",
            });

      const hourlySlot = hourlyByDay[i] ?? null;

      return {
        dayLabel: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
        icon: weatherCodeToIcon(d.weather_code[i]),
        tempMin: d.temperature_2m_min[i],
        tempMax: d.temperature_2m_max[i],
        precipitationSum: d.precipitation_sum[i],
        windMax: d.wind_speed_10m_max?.[i] ?? hourlySlot?.maxWind ?? 0,
        gustsMax: d.wind_gusts_10m_max?.[i] ?? hourlySlot?.maxGusts ?? null,
        windDir:
          d.wind_direction_10m_dominant?.[i] ??
          hourlySlot?.windDirection ??
          null,
        humidity: hourlySlot?.avgHumidity ?? null,
        pressure: hourlySlot?.avgPressure ?? null,
      };
    });
  });

  /** Groupe les slots 3h/1h par jour pour le rowspan du tableau. */
  readonly slotGroups = computed<SlotGroup[]>(() => {
    const allSlots = this.slots();
    if (allSlots.length === 0) return [];

    const groups: SlotGroup[] = [];
    let currentDay = "";
    let currentGroup: WeatherTimeSlot[] = [];

    for (const slot of allSlots) {
      const day = slot.label.slice(0, 10);
      if (day !== currentDay) {
        if (currentGroup.length > 0) {
          groups.push({
            dayLabel: this.formatDayLabel(currentDay),
            slots: currentGroup,
          });
        }
        currentDay = day;
        currentGroup = [slot];
      } else {
        currentGroup.push(slot);
      }
    }
    if (currentGroup.length > 0) {
      groups.push({
        dayLabel: this.formatDayLabel(currentDay),
        slots: currentGroup,
      });
    }

    return groups;
  });

  /** Change la granularite et emet l'evenement. */
  setGranularity(value: OverviewGranularity): void {
    if (this.granularity() === value) return;
    this.granularity.set(value);
    this.granularityChange.emit(value);
  }

  /** Formate l'heure d'un slot (HH:mm). */
  formatTime(label: string): string {
    return label.slice(11, 16);
  }

  /**
   * Couleur de fond temperature — gradient froid→chaud.
   * Bleu (#3b82f6) → Cyan → Vert → Jaune → Orange → Rouge (#ef4444).
   */
  tempColor(temp: number, alpha: number): string {
    const t = Math.max(-10, Math.min(40, temp));
    const ratio = (t + 10) / 50;

    let r: number, g: number, b: number;
    if (ratio < 0.2) {
      const p = ratio / 0.2;
      r = Math.round(59 + 6 * p);
      g = Math.round(130 + 70 * p);
      b = Math.round(246 - 20 * p);
    } else if (ratio < 0.4) {
      const p = (ratio - 0.2) / 0.2;
      r = Math.round(65 + 100 * p);
      g = Math.round(200 + 55 * p);
      b = Math.round(226 - 170 * p);
    } else if (ratio < 0.6) {
      const p = (ratio - 0.4) / 0.2;
      r = Math.round(165 + 90 * p);
      g = 255;
      b = Math.round(56 - 20 * p);
    } else if (ratio < 0.8) {
      const p = (ratio - 0.6) / 0.2;
      r = 255;
      g = Math.round(255 - 120 * p);
      b = Math.round(36 - 20 * p);
    } else {
      const p = (ratio - 0.8) / 0.2;
      r = Math.round(255 - 16 * p);
      g = Math.round(135 - 67 * p);
      b = Math.round(16 + 52 * p);
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /** Formate un label de jour a partir d'une date ISO. */
  private formatDayLabel(isoDate: string): string {
    const date = new Date(isoDate);
    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    if (isToday) {
      return $localize`:weather.daily.today|@@weatherDailyToday:Aujourd'hui`;
    }

    const label = date.toLocaleDateString(this.localeId, {
      weekday: "short",
      day: "numeric",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}
