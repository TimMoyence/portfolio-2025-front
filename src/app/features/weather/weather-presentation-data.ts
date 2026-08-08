import type {
  AirQualityData,
  CurrentWeather,
  DailyForecast,
  ForecastResponse,
  HourlyForecast,
} from '../../core/models/weather.model';

export const MOCK_CURRENT: CurrentWeather = {
  time: '2026-04-09T14:00',
  temperature_2m: 18,
  weather_code: 2,
  wind_speed_10m: 12,
  apparent_temperature: 16,
  relative_humidity_2m: 65,
  pressure_msl: 1013,
  uv_index: 3,
  wind_direction_10m: 220,
  wind_gusts_10m: 24,
  cloud_cover: 40,
  visibility: 10000,
  dew_point_2m: 11,
};

interface MockHour {
  readonly index: number;
  readonly hour: number;
  readonly dayOffset: number;
}

const MOCK_HOURS: readonly MockHour[] = Array.from({ length: 48 }, (_, index) => ({
  index,
  hour: index % 24,
  dayOffset: Math.floor(index / 24),
}));

function hourlyTime({ hour, dayOffset }: MockHour): string {
  return new Date(2026, 3, 9 + dayOffset, hour).toISOString().slice(0, 16);
}

function hourlyTemperature(hour: number): number {
  const base = 14;
  const amplitude = 5;
  const phase = ((hour - 14) * Math.PI) / 12;
  return Math.round((base + amplitude * Math.cos(phase)) * 10) / 10;
}

function hourlyWeatherCode({ hour, dayOffset }: MockHour): number {
  if (dayOffset === 0) return hour >= 6 && hour <= 18 ? 2 : 1;
  return hour >= 14 ? 3 : 2;
}

function hourlyPrecipitation({ hour, dayOffset }: MockHour): number {
  return dayOffset === 1 && hour >= 16 && hour <= 20 ? 0.4 : 0;
}

function hourlyUvIndex(hour: number): number {
  if (hour < 7 || hour > 19) return 0;
  return Math.round(5 * Math.sin(((hour - 7) * Math.PI) / 12));
}

function generateHourlyData(): HourlyForecast {
  return {
    time: MOCK_HOURS.map(hourlyTime),
    temperature_2m: MOCK_HOURS.map(({ hour }) => hourlyTemperature(hour)),
    weather_code: MOCK_HOURS.map(hourlyWeatherCode),
    wind_speed_10m: MOCK_HOURS.map(({ hour }) =>
      Math.round(10 + 4 * Math.sin((hour * Math.PI) / 12)),
    ),
    precipitation: MOCK_HOURS.map(hourlyPrecipitation),
    relative_humidity_2m: MOCK_HOURS.map(({ hour }) =>
      Math.round(55 + 15 * Math.cos(((hour - 4) * Math.PI) / 12)),
    ),
    pressure_msl: MOCK_HOURS.map(
      ({ index }) => 1013 + Math.round(2 * Math.sin((index * Math.PI) / 24)),
    ),
    uv_index: MOCK_HOURS.map(({ hour }) => hourlyUvIndex(hour)),
    wind_direction_10m: MOCK_HOURS.map(
      ({ hour }) => 200 + Math.round(40 * Math.sin((hour * Math.PI) / 24)),
    ),
    wind_gusts_10m: MOCK_HOURS.map(({ hour }) =>
      Math.round(18 + 8 * Math.sin((hour * Math.PI) / 12)),
    ),
  };
}

export const MOCK_DAILY: DailyForecast = {
  time: [
    '2026-04-09',
    '2026-04-10',
    '2026-04-11',
    '2026-04-12',
    '2026-04-13',
    '2026-04-14',
    '2026-04-15',
  ],
  weather_code: [2, 0, 0, 3, 61, 61, 2],
  temperature_2m_max: [18, 21, 23, 19, 16, 14, 17],
  temperature_2m_min: [11, 12, 14, 13, 10, 9, 10],
  sunrise: [
    '2026-04-09T07:05',
    '2026-04-10T07:03',
    '2026-04-11T07:01',
    '2026-04-12T06:59',
    '2026-04-13T06:57',
    '2026-04-14T06:55',
    '2026-04-15T06:53',
  ],
  sunset: [
    '2026-04-09T20:32',
    '2026-04-10T20:34',
    '2026-04-11T20:35',
    '2026-04-12T20:37',
    '2026-04-13T20:38',
    '2026-04-14T20:40',
    '2026-04-15T20:42',
  ],
  precipitation_sum: [0, 0, 0, 0.5, 8.2, 12.4, 1.1],
  uv_index_max: [3, 5, 6, 2, 1, 1, 4],
  wind_speed_10m_max: [14, 12, 10, 18, 25, 22, 15],
  wind_gusts_10m_max: [24, 20, 16, 30, 42, 38, 24],
  wind_direction_10m_dominant: [220, 200, 190, 250, 280, 300, 210],
};

export const MOCK_HOURLY: HourlyForecast = generateHourlyData();

export const MOCK_FORECAST: ForecastResponse = {
  current: MOCK_CURRENT,
  hourly: MOCK_HOURLY,
  daily: MOCK_DAILY,
};

export const MOCK_AIR_QUALITY: AirQualityData = {
  current: {
    european_aqi: 42,
    pm2_5: 8.2,
    pm10: 12.5,
    ozone: 42.1,
    nitrogen_dioxide: 18.3,
    sulphur_dioxide: 4.7,
  },
  hourly: {
    time: MOCK_HOURLY.time.slice(0, 24),
    european_aqi: Array.from({ length: 24 }, (_, i) =>
      Math.round(35 + 15 * Math.sin((i * Math.PI) / 12)),
    ),
    pm2_5: Array.from(
      { length: 24 },
      (_, i) => Math.round((6 + 4 * Math.sin((i * Math.PI) / 12)) * 10) / 10,
    ),
    pm10: Array.from(
      { length: 24 },
      (_, i) => Math.round((10 + 5 * Math.sin((i * Math.PI) / 12)) * 10) / 10,
    ),
    ozone: Array.from(
      { length: 24 },
      (_, i) => Math.round((35 + 15 * Math.sin((i * Math.PI) / 12)) * 10) / 10,
    ),
  },
};
