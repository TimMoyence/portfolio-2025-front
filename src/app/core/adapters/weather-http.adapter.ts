import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type { Observable } from "rxjs";
import { of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { getApiBaseUrl } from "../http/api-config";
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
} from "../models/weather.model";
import type { WeatherPort } from "../ports/weather.port";

/** Reponse transport Nominatim (reverse geocoding, sous-ensemble utilise). */
interface NominatimResponse {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    country?: string;
    country_code?: string;
  };
}

/**
 * Adaptateur HTTP pour le port meteo.
 * Communique avec les endpoints `/weather/geocoding`, `/weather/forecast`
 * et `/weather/preferences`. Le reverse-geocoding passe par Nominatim (OSM).
 */
@Injectable()
export class WeatherHttpAdapter implements WeatherPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  /** Recherche de villes par nom via l'API de geocodage. */
  searchCity(
    name: string,
    language = "fr",
    count = 5,
  ): Observable<GeocodingResponse> {
    return this.http.get<GeocodingResponse>(
      `${this.baseUrl}/weather/geocoding`,
      {
        params: { name, language, count: count.toString() },
      },
    );
  }

  /**
   * Reverse-geocoding via Nominatim (OpenStreetMap).
   * Retourne le nom de la ville (city > town > village > municipality)
   * ou `null` si indisponible.
   */
  reverseGeocode(lat: number, lon: number): Observable<string | null> {
    return this.http
      .get<NominatimResponse>("https://nominatim.openstreetmap.org/reverse", {
        params: {
          lat: lat.toString(),
          lon: lon.toString(),
          format: "json",
          zoom: "10",
        },
      })
      .pipe(
        map((resp) => {
          const addr = resp.address;
          return (
            addr?.city ??
            addr?.town ??
            addr?.village ??
            addr?.municipality ??
            null
          );
        }),
        catchError(() => of(null)),
      );
  }

  /** Recuperation des previsions meteo pour des coordonnees donnees. */
  getForecast(
    latitude: number,
    longitude: number,
    timezone = "auto",
    forecastDays?: number,
  ): Observable<ForecastResponse> {
    const params: Record<string, string> = {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      timezone,
    };
    if (forecastDays) {
      params["forecastDays"] = forecastDays.toString();
    }
    return this.http.get<ForecastResponse>(`${this.baseUrl}/weather/forecast`, {
      params,
    });
  }

  /** Recuperation des preferences meteo de l'utilisateur connecte. */
  getPreferences(): Observable<WeatherPreferences> {
    return this.http.get<WeatherPreferences>(
      `${this.baseUrl}/weather/preferences`,
    );
  }

  /** Mise a jour partielle des preferences meteo. */
  updatePreferences(
    data: Partial<
      Pick<
        WeatherPreferences,
        | "level"
        | "favoriteCities"
        | "tooltipsSeen"
        | "units"
        | "defaultCityIndex"
        | "overviewGranularity"
      >
    >,
  ): Observable<WeatherPreferences> {
    return this.http.patch<WeatherPreferences>(
      `${this.baseUrl}/weather/preferences`,
      data,
    );
  }

  /** Enregistrement de l'utilisation quotidienne de l'app meteo. */
  recordUsage(): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/weather/preferences/record-usage`,
      {},
    );
  }

  /** Recuperation des donnees de qualite de l'air pour des coordonnees donnees. */
  getAirQuality(
    latitude: number,
    longitude: number,
  ): Observable<AirQualityData> {
    return this.http.get<AirQualityData>(
      `${this.baseUrl}/weather/air-quality`,
      {
        params: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        },
      },
    );
  }

  /** Recuperation des previsions multi-modeles (ensemble) pour des coordonnees donnees. */
  getEnsemble(latitude: number, longitude: number): Observable<EnsembleData> {
    return this.http.get<EnsembleData>(`${this.baseUrl}/weather/ensemble`, {
      params: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      },
    });
  }

  /** Recuperation des donnees historiques journalieres pour une plage de dates. */
  getHistorical(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
  ): Observable<HistoricalData> {
    return this.http.get<HistoricalData>(`${this.baseUrl}/weather/historical`, {
      params: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        startDate,
        endDate,
      },
    });
  }

  /** Donnees meteo detaillees courantes (OpenWeatherMap). */
  getDetailedCurrent(
    latitude: number,
    longitude: number,
  ): Observable<DetailedCurrentWeather> {
    return this.http.get<DetailedCurrentWeather>(
      `${this.baseUrl}/weather/current-detailed`,
      {
        params: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        },
      },
    );
  }

  /** Previsions detaillees (OpenWeatherMap). */
  getDetailedForecast(
    latitude: number,
    longitude: number,
  ): Observable<DetailedForecastResult> {
    return this.http.get<DetailedForecastResult>(
      `${this.baseUrl}/weather/forecast-detailed`,
      {
        params: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        },
      },
    );
  }

  /** Alertes meteo synthetiques. */
  getAlerts(
    latitude: number,
    longitude: number,
  ): Observable<WeatherAlertResult> {
    return this.http.get<WeatherAlertResult>(`${this.baseUrl}/weather/alerts`, {
      params: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      },
    });
  }
}
