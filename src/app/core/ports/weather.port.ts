import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  AirQualityData,
  DetailedCurrentWeather,
  DetailedForecastResult,
  EnsembleData,
  ForecastResponse,
  GeocodingResponse,
  HistoricalData,
  WeatherAlertResult,
  WeatherPreferences,
} from '../models/weather.model';

export interface WeatherPort {
  searchCity(name: string, language?: string, count?: number): Observable<GeocodingResponse>;

  reverseGeocode(lat: number, lon: number): Observable<string | null>;

  getForecast(
    latitude: number,
    longitude: number,
    timezone?: string,
    forecastDays?: number,
  ): Observable<ForecastResponse>;

  getPreferences(): Observable<WeatherPreferences>;

  updatePreferences(
    data: Partial<
      Pick<
        WeatherPreferences,
        | 'level'
        | 'favoriteCities'
        | 'tooltipsSeen'
        | 'units'
        | 'defaultCityIndex'
        | 'overviewGranularity'
      >
    >,
  ): Observable<WeatherPreferences>;

  recordUsage(): Observable<void>;

  getAirQuality(latitude: number, longitude: number): Observable<AirQualityData>;

  getEnsemble(latitude: number, longitude: number): Observable<EnsembleData>;

  getHistorical(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
  ): Observable<HistoricalData>;

  getDetailedCurrent(latitude: number, longitude: number): Observable<DetailedCurrentWeather>;

  getDetailedForecast(latitude: number, longitude: number): Observable<DetailedForecastResult>;

  getAlerts(latitude: number, longitude: number): Observable<WeatherAlertResult>;
}

export const WEATHER_PORT = new InjectionToken<WeatherPort>('WEATHER_PORT');
