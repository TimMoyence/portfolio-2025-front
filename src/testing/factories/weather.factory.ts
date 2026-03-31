import type {
  AirQualityData,
  CityResult,
  EnsembleData,
  ForecastResponse,
  HistoricalData,
  WeatherPreferences,
} from "../../app/core/models/weather.model";
import type { WeatherPort } from "../../app/core/ports/weather.port";

/**
 * Construit un objet WeatherPreferences avec des valeurs par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildWeatherPreferences(
  overrides?: Partial<WeatherPreferences>,
): WeatherPreferences {
  return {
    id: "pref-1",
    userId: "user-1",
    level: "discovery",
    favoriteCities: [],
    daysUsed: 0,
    lastUsedAt: null,
    tooltipsSeen: [],
    ...overrides,
  };
}

/**
 * Construit un objet CityResult avec des valeurs par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildCityResult(overrides?: Partial<CityResult>): CityResult {
  return {
    id: 1,
    name: "Paris",
    latitude: 48.85,
    longitude: 2.35,
    country: "France",
    country_code: "FR",
    ...overrides,
  };
}

/**
 * Construit un objet ForecastResponse avec des valeurs par defaut.
 * Inclut les champs etendus Curieux (UV, pression, humidite, etc.).
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildForecastResponse(
  overrides?: Partial<ForecastResponse>,
): ForecastResponse {
  return {
    current: {
      time: "2026-03-31T12:00",
      temperature_2m: 18,
      weather_code: 0,
      wind_speed_10m: 12,
      apparent_temperature: 16,
      relative_humidity_2m: 55,
      pressure_msl: 1013,
      uv_index: 4,
      wind_direction_10m: 180,
      wind_gusts_10m: 25,
      cloud_cover: 30,
      visibility: 10000,
      dew_point_2m: 9,
    },
    hourly: {
      time: ["2026-03-31T12:00"],
      temperature_2m: [18],
      weather_code: [0],
      wind_speed_10m: [12],
      precipitation: [0],
      relative_humidity_2m: [55],
      dew_point_2m: [9],
      pressure_msl: [1013],
      uv_index: [4],
      wind_direction_10m: [180],
      wind_gusts_10m: [25],
      cloud_cover: [30],
      visibility: [10000],
    },
    daily: {
      time: ["2026-03-31"],
      weather_code: [0],
      temperature_2m_max: [20],
      temperature_2m_min: [10],
      sunrise: ["2026-03-31T06:30"],
      sunset: ["2026-03-31T19:30"],
      precipitation_sum: [0],
      uv_index_max: [5],
      wind_speed_10m_max: [20],
      wind_gusts_10m_max: [35],
      wind_direction_10m_dominant: [180],
    },
    ...overrides,
  };
}

/**
 * Construit un objet AirQualityData avec des valeurs par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildAirQualityData(
  overrides?: Partial<AirQualityData>,
): AirQualityData {
  return {
    current: {
      european_aqi: 25,
      pm2_5: 8.5,
      pm10: 15.2,
      ozone: 52.3,
      nitrogen_dioxide: 12.1,
      sulphur_dioxide: 3.4,
    },
    hourly: {
      time: ["2026-03-31T12:00"],
      european_aqi: [25],
      pm2_5: [8.5],
      pm10: [15.2],
      ozone: [52.3],
    },
    ...overrides,
  };
}

/**
 * Construit un objet EnsembleData avec trois modeles (ECMWF, GFS, ICON).
 * Le modele GFS inclut des donnees CAPE par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildEnsembleData(
  overrides?: Partial<EnsembleData>,
): EnsembleData {
  return {
    models: [
      {
        model: "ECMWF",
        hourly: {
          time: ["2026-03-31T12:00", "2026-03-31T13:00"],
          temperature_2m: [18, 19],
          precipitation: [0, 0.2],
          wind_speed_10m: [12, 14],
        },
      },
      {
        model: "GFS",
        hourly: {
          time: ["2026-03-31T12:00", "2026-03-31T13:00"],
          temperature_2m: [17, 18],
          precipitation: [0.1, 0.3],
          wind_speed_10m: [11, 13],
          cape: [750, 800],
        },
      },
      {
        model: "ICON",
        hourly: {
          time: ["2026-03-31T12:00", "2026-03-31T13:00"],
          temperature_2m: [18.5, 19.5],
          precipitation: [0, 0.1],
          wind_speed_10m: [13, 15],
        },
      },
    ],
    ...overrides,
  };
}

/**
 * Construit un objet HistoricalData avec des valeurs journalieres sur 3 jours.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildHistoricalData(
  overrides?: Partial<HistoricalData>,
): HistoricalData {
  return {
    daily: {
      time: ["2026-03-01", "2026-03-02", "2026-03-03"],
      temperature_2m_mean: [12, 13, 14],
      temperature_2m_max: [16, 17, 18],
      temperature_2m_min: [8, 9, 10],
      precipitation_sum: [0, 2.5, 0.5],
    },
    ...overrides,
  };
}

/**
 * Cree un stub complet du port meteo avec des spies Jasmine.
 * Chaque methode est un spy independant, non configure par defaut.
 */
export function createWeatherPortStub(): Record<
  keyof WeatherPort,
  jasmine.Spy
> {
  return {
    searchCity: jasmine.createSpy("searchCity"),
    getForecast: jasmine.createSpy("getForecast"),
    getPreferences: jasmine.createSpy("getPreferences"),
    updatePreferences: jasmine.createSpy("updatePreferences"),
    recordUsage: jasmine.createSpy("recordUsage"),
    getAirQuality: jasmine.createSpy("getAirQuality"),
    getEnsemble: jasmine.createSpy("getEnsemble"),
    getHistorical: jasmine.createSpy("getHistorical"),
  };
}
