import { Inject, Injectable } from "@angular/core";
import type { Observable } from "rxjs";
import type {
  AirQualityData,
  EnsembleData,
  ForecastResponse,
  GeocodingResponse,
  HistoricalData,
  WeatherPreferences,
} from "../models/weather.model";
import type { WeatherPort } from "../ports/weather.port";
import { WEATHER_PORT } from "../ports/weather.port";

/**
 * Facade pour l'acces aux donnees meteorologiques.
 * Delegue les appels au port injecte.
 */
@Injectable({
  providedIn: "root",
})
export class WeatherService {
  constructor(
    @Inject(WEATHER_PORT) private readonly weatherPort: WeatherPort,
  ) {}

  /** Recherche de villes par nom. */
  searchCity(name: string): Observable<GeocodingResponse> {
    return this.weatherPort.searchCity(name);
  }

  /** Recuperation des previsions meteo pour des coordonnees donnees. */
  getForecast(
    latitude: number,
    longitude: number,
  ): Observable<ForecastResponse> {
    return this.weatherPort.getForecast(latitude, longitude);
  }

  /** Recuperation des preferences meteo de l'utilisateur. */
  getPreferences(): Observable<WeatherPreferences> {
    return this.weatherPort.getPreferences();
  }

  /** Mise a jour partielle des preferences meteo. */
  updatePreferences(
    data: Partial<
      Pick<WeatherPreferences, "level" | "favoriteCities" | "tooltipsSeen">
    >,
  ): Observable<WeatherPreferences> {
    return this.weatherPort.updatePreferences(data);
  }

  /** Enregistrement de l'utilisation quotidienne. */
  recordUsage(): Observable<void> {
    return this.weatherPort.recordUsage();
  }

  /** Recuperation des donnees de qualite de l'air pour des coordonnees donnees. */
  getAirQuality(
    latitude: number,
    longitude: number,
  ): Observable<AirQualityData> {
    return this.weatherPort.getAirQuality(latitude, longitude);
  }

  /** Recuperation des previsions multi-modeles (ensemble) pour des coordonnees donnees. */
  getEnsemble(latitude: number, longitude: number): Observable<EnsembleData> {
    return this.weatherPort.getEnsemble(latitude, longitude);
  }

  /** Recuperation des donnees historiques journalieres pour une plage de dates. */
  getHistorical(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
  ): Observable<HistoricalData> {
    return this.weatherPort.getHistorical(
      latitude,
      longitude,
      startDate,
      endDate,
    );
  }
}
