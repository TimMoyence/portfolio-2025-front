import { inject, Injectable, LOCALE_ID, signal } from '@angular/core';
import { take } from 'rxjs/operators';
import type { WeatherPreferences } from '../../../core/models/weather.model';
import type { WeatherPort } from '../../../core/ports/weather.port';
import { WEATHER_PORT } from '../../../core/ports/weather.port';

@Injectable()
export class UnitPreferencesService {
  private readonly weatherService: WeatherPort = inject(WEATHER_PORT);
  private readonly locale = inject(LOCALE_ID);

  private readonly defaults = this.getLocaleDefaults();

  readonly temperatureUnit = signal<'celsius' | 'fahrenheit'>(this.defaults.temperature);

  readonly speedUnit = signal<'kmh' | 'mph'>(this.defaults.speed);

  readonly pressureUnit = signal<'hpa' | 'inhg'>(this.defaults.pressure);

  loadFromPreferences(prefs: WeatherPreferences): void {
    if (prefs.units) {
      if (prefs.units.temperature) this.temperatureUnit.set(prefs.units.temperature);
      if (prefs.units.speed) this.speedUnit.set(prefs.units.speed);
      if (prefs.units.pressure) this.pressureUnit.set(prefs.units.pressure);
    }
  }

  setTemperatureUnit(unit: 'celsius' | 'fahrenheit'): void {
    this.temperatureUnit.set(unit);
    this.syncToBackend();
  }

  setSpeedUnit(unit: 'kmh' | 'mph'): void {
    this.speedUnit.set(unit);
    this.syncToBackend();
  }

  setPressureUnit(unit: 'hpa' | 'inhg'): void {
    this.pressureUnit.set(unit);
    this.syncToBackend();
  }

  private getLocaleDefaults(): {
    temperature: 'celsius' | 'fahrenheit';
    speed: 'kmh' | 'mph';
    pressure: 'hpa' | 'inhg';
  } {
    if (this.locale === 'en' || this.locale === 'en-US') {
      return { temperature: 'fahrenheit', speed: 'mph', pressure: 'inhg' };
    }
    return { temperature: 'celsius', speed: 'kmh', pressure: 'hpa' };
  }

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
