import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import type {
  CurrentWeather,
  DetailedCurrentWeather,
} from "../../../../core/models/weather.model";
import { UnitPipe } from "../../pipes/unit.pipe";
import { UnitPreferencesService } from "../../services/unit-preferences.service";
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
  imports: [CommonModule, UnitPipe],
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
              {{
                current()!.temperature_2m | unit: unitService.temperatureUnit()
              }}
            </p>
            <div class="mt-2 flex flex-wrap gap-4 text-sm text-white/70">
              <span i18n="weather.current.feelsLike|@@weatherCurrentFeelsLike">
                Ressenti
                {{
                  current()!.apparent_temperature
                    | unit: unitService.temperatureUnit()
                }}
              </span>
              <span i18n="weather.current.wind|@@weatherCurrentWind">
                Vent
                {{ current()!.wind_speed_10m | unit: unitService.speedUnit() }}
              </span>
            </div>
          </div>
        </div>

        <!-- Donnees enrichies OWM -->
        @if (detailed(); as detail) {
          <div
            class="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3"
          >
            <!-- Probabilite de precipitation -->
            @if (detail.precipitationProbability > 0 || detail.rain1h > 0) {
              <div class="text-center">
                <p
                  class="text-xs text-white/50"
                  i18n="weather.current.precip|@@weatherCurrentPrecip"
                >
                  Pluie
                </p>
                <p class="text-sm font-medium text-white">
                  @if (detail.rain1h > 0) {
                    {{ detail.rain1h | number: "1.0-1" }}mm/h
                  } @else {
                    {{ detail.precipitationProbability | number: "1.0-0" }}%
                  }
                </p>
              </div>
            }
            <!-- Humidite -->
            <div class="text-center">
              <p
                class="text-xs text-white/50"
                i18n="weather.current.humidity|@@weatherCurrentHumidity"
              >
                Humidité
              </p>
              <p class="text-sm font-medium text-white">
                {{ detail.humidity }}%
              </p>
            </div>
            <!-- Visibilite -->
            <div class="text-center">
              <p
                class="text-xs text-white/50"
                i18n="weather.current.visibility|@@weatherCurrentVisibility"
              >
                Visibilité
              </p>
              <p class="text-sm font-medium text-white">
                {{ detail.visibility }} km
              </p>
            </div>
          </div>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentConditionsComponent {
  /** Service de preferences d'unites. */
  readonly unitService = inject(UnitPreferencesService);

  /** Donnees meteo courantes. */
  readonly current = input<CurrentWeather | null>(null);

  /** Donnees meteo detaillees courantes (source OpenWeatherMap). */
  readonly detailed = input<DetailedCurrentWeather | null>(null);

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
