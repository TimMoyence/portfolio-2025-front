import { inject, Injectable, signal } from "@angular/core";
import { take } from "rxjs/operators";
import type { WeatherPreferences } from "../../../core/models/weather.model";
import type { WeatherPort } from "../../../core/ports/weather.port";
import { WEATHER_PORT } from "../../../core/ports/weather.port";

/**
 * Service de gestion des preferences d'unites de mesure.
 * Synchronise les choix d'unites (temperature, vitesse, pression)
 * avec le backend via le port meteo.
 */
@Injectable()
export class UnitPreferencesService {
  private readonly weatherService: WeatherPort = inject(WEATHER_PORT);

  /** Unite de temperature selectionnee. */
  readonly temperatureUnit = signal<"celsius" | "fahrenheit">("celsius");

  /** Unite de vitesse selectionnee. */
  readonly speedUnit = signal<"kmh" | "mph">("kmh");

  /** Unite de pression selectionnee. */
  readonly pressureUnit = signal<"hpa" | "inhg">("hpa");

  /** Charge les unites depuis les preferences backend. */
  loadFromPreferences(prefs: WeatherPreferences): void {
    if (prefs.units) {
      if (prefs.units.temperature)
        this.temperatureUnit.set(prefs.units.temperature);
      if (prefs.units.speed) this.speedUnit.set(prefs.units.speed);
      if (prefs.units.pressure) this.pressureUnit.set(prefs.units.pressure);
    }
  }

  /** Met a jour l'unite de temperature et synchronise avec le backend. */
  setTemperatureUnit(unit: "celsius" | "fahrenheit"): void {
    this.temperatureUnit.set(unit);
    this.syncToBackend();
  }

  /** Met a jour l'unite de vitesse et synchronise avec le backend. */
  setSpeedUnit(unit: "kmh" | "mph"): void {
    this.speedUnit.set(unit);
    this.syncToBackend();
  }

  /** Met a jour l'unite de pression et synchronise avec le backend. */
  setPressureUnit(unit: "hpa" | "inhg"): void {
    this.pressureUnit.set(unit);
    this.syncToBackend();
  }

  /** Synchronise les unites courantes avec le backend. */
  private syncToBackend(): void {
    this.weatherService
      .updatePreferences({
        units: {
          temperature: this.temperatureUnit(),
          speed: this.speedUnit(),
          pressure: this.pressureUnit(),
        },
      })
      .pipe(take(1))
      .subscribe();
  }
}
