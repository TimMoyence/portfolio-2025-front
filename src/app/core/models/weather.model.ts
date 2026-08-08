export interface CityResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
}

export interface GeocodingResponse {
  results: CityResult[];
}

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

export interface ForecastResponse {
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
}

export type WeatherLevel = 'discovery' | 'curious' | 'expert';

export type OverviewGranularity = 'day' | '3h' | '1h';

export interface FavoriteCity {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

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

interface EnsembleModel {
  model: string;
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    wind_speed_10m: number[];
    cape?: number[];
  };
}

export interface EnsembleData {
  models: EnsembleModel[];
}

export interface HistoricalData {
  daily: {
    time: string[];
    temperature_2m_mean: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

interface UnitPreferences {
  temperature: 'celsius' | 'fahrenheit';
  speed: 'kmh' | 'mph';
  pressure: 'hpa' | 'inhg';
}

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
  partOfDay: 'd' | 'n';
  timezoneOffset: number;
}

interface DetailedHourlyItem {
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
  partOfDay: 'd' | 'n';
}

interface DetailedDailyItem {
  date: string;
  minTemp: number;
  maxTemp: number;
  conditionId: number;
  conditionName: string;
  conditionText: string;
  conditionIcon: string;
}

export interface DetailedForecastResult {
  cityName: string;
  country: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number;
  hourly: DetailedHourlyItem[];
  daily: DetailedDailyItem[];
}

type AlertSeverity = 'minor' | 'moderate' | 'severe' | 'extreme';

export interface WeatherAlert {
  type: string;
  severity: AlertSeverity;
  headline: string;
  description: string;
  startTime: string;
  endTime: string;
}

export interface WeatherAlertResult {
  alerts: WeatherAlert[];
}
