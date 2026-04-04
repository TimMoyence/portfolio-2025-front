/** Resultat de recherche de ville via l'API de geocodage. */
export interface CityResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
}

/** Reponse de l'endpoint de geocodage. */
export interface GeocodingResponse {
  results: CityResult[];
}

/** Donnees meteo courantes retournees par l'API. */
export interface CurrentWeather {
  time: string;
  temperature_2m: number;
  weather_code: number;
  wind_speed_10m: number;
  apparent_temperature: number;
  relative_humidity_2m?: number;
  pressure_msl?: number;
  uv_index?: number;
  wind_direction_10m?: number;
  wind_gusts_10m?: number;
  cloud_cover?: number;
  visibility?: number;
  dew_point_2m?: number;
}

/** Previsions horaires retournees par l'API. */
export interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  precipitation: number[];
  relative_humidity_2m?: number[];
  dew_point_2m?: number[];
  pressure_msl?: number[];
  uv_index?: number[];
  wind_direction_10m?: number[];
  wind_gusts_10m?: number[];
  cloud_cover?: number[];
  visibility?: number[];
}

/** Previsions journalieres retournees par l'API. */
export interface DailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  precipitation_sum: number[];
  uv_index_max?: number[];
  wind_speed_10m_max?: number[];
  wind_gusts_10m_max?: number[];
  wind_direction_10m_dominant?: number[];
}

/** Reponse complete de l'endpoint de previsions meteo. */
export interface ForecastResponse {
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
}

/** Niveau d'experience meteo de l'utilisateur. */
export type WeatherLevel = "discovery" | "curious" | "expert";

/** Granularite de la vue d'ensemble hebdomadaire. */
export type OverviewGranularity = "day" | "3h" | "1h";

/** Ville favorite enregistree dans les preferences. */
export interface FavoriteCity {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

/** Donnees de qualite de l'air retournees par l'API. */
export interface AirQualityData {
  current: {
    european_aqi: number;
    pm2_5: number;
    pm10: number;
    ozone: number;
    nitrogen_dioxide: number;
    sulphur_dioxide: number;
  };
  hourly: {
    time: string[];
    european_aqi: number[];
    pm2_5: number[];
    pm10: number[];
    ozone: number[];
  };
}

/** Previsions d'un modele meteorologique dans un ensemble multi-modeles. */
export interface EnsembleModel {
  model: string;
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    wind_speed_10m: number[];
    cape?: number[];
  };
}

/** Donnees d'ensemble multi-modeles (ECMWF, GFS, ICON). */
export interface EnsembleData {
  models: EnsembleModel[];
}

/** Donnees historiques journalieres pour comparaison climatologique. */
export interface HistoricalData {
  daily: {
    time: string[];
    temperature_2m_mean: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

/** Preferences d'unites de mesure de l'utilisateur. */
export interface UnitPreferences {
  temperature: "celsius" | "fahrenheit";
  speed: "kmh" | "mph";
  pressure: "hpa" | "inhg";
}

/** Preferences meteo de l'utilisateur, synchronisees avec le backend. */
export interface WeatherPreferences {
  id: string;
  userId: string;
  level: WeatherLevel;
  favoriteCities: FavoriteCity[];
  daysUsed: number;
  lastUsedAt: string | null;
  tooltipsSeen: string[];
  units?: UnitPreferences;
  defaultCityIndex: number | null;
  overviewGranularity: OverviewGranularity;
}

/** Donnees meteo detaillees courantes (source OpenWeatherMap). */
export interface DetailedCurrentWeather {
  temperature: number;
  feelsLike: number;
  minTemp: number;
  maxTemp: number;
  humidity: number;
  seaLevelPressure: number;
  groundLevelPressure: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  cloudCover: number;
  visibility: number;
  rain1h: number;
  snow1h: number;
  precipitationProbability: number;
  conditionId: number;
  conditionName: string;
  conditionText: string;
  conditionIcon: string;
  sunrise: string;
  sunset: string;
  isDaytime: boolean;
  partOfDay: "d" | "n";
  timezoneOffset: number;
}

/** Element horaire detaille (source OpenWeatherMap, 3h). */
export interface DetailedHourlyItem {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  seaLevelPressure: number;
  groundLevelPressure: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  cloudCover: number;
  visibility: number;
  rain3h: number;
  snow3h: number;
  precipitationProbability: number;
  conditionId: number;
  conditionName: string;
  conditionText: string;
  conditionIcon: string;
  partOfDay: "d" | "n";
}

/** Element journalier detaille (source OpenWeatherMap). */
export interface DetailedDailyItem {
  date: string;
  minTemp: number;
  maxTemp: number;
  conditionId: number;
  conditionName: string;
  conditionText: string;
  conditionIcon: string;
}

/** Resultat des previsions detaillees (source OpenWeatherMap). */
export interface DetailedForecastResult {
  cityName: string;
  country: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number;
  hourly: DetailedHourlyItem[];
  daily: DetailedDailyItem[];
}

/** Severite d'une alerte meteo. */
export type AlertSeverity = "minor" | "moderate" | "severe" | "extreme";

/** Alerte meteo synthetique. */
export interface WeatherAlert {
  type: string;
  severity: AlertSeverity;
  headline: string;
  description: string;
  startTime: string;
  endTime: string;
}

/** Resultat des alertes meteo. */
export interface WeatherAlertResult {
  alerts: WeatherAlert[];
}
