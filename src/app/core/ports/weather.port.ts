import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";
import type {
  AirQualityData,
  DetailedCurrentWeather,
  DetailedForecastResult,
  EnsembleData,
  ForecastResponse,
  GeocodingResponse,
  HistoricalData,
  WeatherPreferences,
} from "../models/weather.model";

/** Port d'acces aux donnees meteorologiques. */
export interface WeatherPort {
  /** Recherche de villes par nom. */
  searchCity(
    name: string,
    language?: string,
    count?: number,
  ): Observable<GeocodingResponse>;

  /** Recuperation des previsions meteo pour des coordonnees donnees. */
  getForecast(
    latitude: number,
    longitude: number,
    timezone?: string,
    forecastDays?: number,
  ): Observable<ForecastResponse>;

  /** Recuperation des preferences meteo de l'utilisateur. */
  getPreferences(): Observable<WeatherPreferences>;

  /** Mise a jour partielle des preferences meteo. */
  updatePreferences(
    data: Partial<
      Pick<
        WeatherPreferences,
        "level" | "favoriteCities" | "tooltipsSeen" | "units"
      >
    >,
  ): Observable<WeatherPreferences>;

  /** Enregistrement de l'utilisation quotidienne. */
  recordUsage(): Observable<void>;

  /** Recuperation des donnees de qualite de l'air pour des coordonnees donnees. */
  getAirQuality(
    latitude: number,
    longitude: number,
  ): Observable<AirQualityData>;

  /** Recuperation des previsions multi-modeles (ensemble) pour des coordonnees donnees. */
  getEnsemble(latitude: number, longitude: number): Observable<EnsembleData>;

  /** Recuperation des donnees historiques journalieres pour une plage de dates. */
  getHistorical(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
  ): Observable<HistoricalData>;

  /** Recuperation des donnees meteo detaillees courantes (OpenWeatherMap). */
  getDetailedCurrent(
    latitude: number,
    longitude: number,
  ): Observable<DetailedCurrentWeather>;

  /** Recuperation des previsions detaillees (OpenWeatherMap). */
  getDetailedForecast(
    latitude: number,
    longitude: number,
  ): Observable<DetailedForecastResult>;
}

export const WEATHER_PORT = new InjectionToken<WeatherPort>("WEATHER_PORT");
