import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import type { CurrentWeather } from "../../../../core/models/weather.model";
import {
  weatherCodeToDescription,
  weatherCodeToIcon,
} from "../../utils/weather-icons";

/**
 * Composant d'affichage des conditions meteo actuelles.
 * Affiche la temperature, l'icone, la description, la temperature ressentie et le vent.
 */
@Component({
  selector: "app-current-conditions",
  standalone: true,
  imports: [CommonModule],
  styles: `
    @keyframes countUp {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    .temp-count-up {
      animation: countUp 0.5s ease-out;
    }
  `,
  template: `
    @if (current()) {
      <div
        class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md"
      >
        <div class="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
          <div class="flex flex-col items-center">
            <img
              [src]="icon()"
              [alt]="description()"
              class="h-20 w-20 drop-shadow-lg"
            />
            <p class="mt-1 text-sm text-white/70">{{ description() }}</p>
          </div>

          <div class="flex flex-col items-center sm:items-start">
            <p class="text-6xl font-light text-white temp-count-up">
              {{ current()!.temperature_2m | number: "1.0-0" }}°
            </p>
            <div class="mt-2 flex flex-wrap gap-4 text-sm text-white/70">
              <span i18n="weather.current.feelsLike|@@weatherCurrentFeelsLike">
                Ressenti
                {{ current()!.apparent_temperature | number: "1.0-0" }}°
              </span>
              <span i18n="weather.current.wind|@@weatherCurrentWind">
                Vent {{ current()!.wind_speed_10m | number: "1.0-0" }} km/h
              </span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentConditionsComponent {
  /** Donnees meteo courantes. */
  readonly current = input<CurrentWeather | null>(null);

  /** Chemin vers l'icone meteo correspondant au code WMO. */
  readonly icon = computed(() => {
    const data = this.current();
    if (!data) return "";
    return weatherCodeToIcon(data.weather_code);
  });

  /** Description textuelle du code meteo. */
  readonly description = computed(() => {
    const data = this.current();
    if (!data) return "";
    return weatherCodeToDescription(data.weather_code);
  });
}
