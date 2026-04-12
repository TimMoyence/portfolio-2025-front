import type {
  AirQualityData,
  CurrentWeather,
  DailyForecast,
  ForecastResponse,
  HourlyForecast,
} from "../../core/models/weather.model";

/**
 * Donnees meteo fictives pour la page de presentation.
 * Simulent un apres-midi de printemps a Paris : partiellement nuageux, 18 °C.
 */

/** Meteo courante : 18 °C, partiellement nuageux, vent 12 km/h SO. */
export const MOCK_CURRENT: CurrentWeather = {
  time: "2026-04-09T14:00",
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

/**
 * Genere 48 heures de previsions horaires realistes.
 * Courbe de temperature avec pic a 20 °C l'apres-midi,
 * creux a 10 °C la nuit.
 */
function generateHourlyData(): HourlyForecast {
  const times: string[] = [];
  const temps: number[] = [];
  const codes: number[] = [];
  const winds: number[] = [];
  const precips: number[] = [];
  const humidities: number[] = [];
  const pressures: number[] = [];
  const uvIndices: number[] = [];
  const windDirs: number[] = [];
  const windGusts: number[] = [];

  for (let i = 0; i < 48; i++) {
    const hour = i % 24;
    const dayOffset = Math.floor(i / 24);
    const date = new Date(2026, 3, 9 + dayOffset, hour);
    times.push(date.toISOString().slice(0, 16));

    // Courbe de temperature sinusoidale : pic a 14h, creux a 4h
    const tempBase = 14;
    const tempAmplitude = 5;
    const tempPhase = ((hour - 14) * Math.PI) / 12;
    temps.push(
      Math.round((tempBase + tempAmplitude * Math.cos(tempPhase)) * 10) / 10,
    );

    // Codes meteo : clair la journee, couvert le soir du jour 2
    if (dayOffset === 0) {
      codes.push(hour >= 6 && hour <= 18 ? 2 : 1);
    } else {
      codes.push(hour >= 14 ? 3 : 2);
    }

    // Vent avec legere variation
    winds.push(Math.round(10 + 4 * Math.sin((hour * Math.PI) / 12)));
    windDirs.push(200 + Math.round(40 * Math.sin((hour * Math.PI) / 24)));
    windGusts.push(Math.round(18 + 8 * Math.sin((hour * Math.PI) / 12)));

    // Precipitations nulles jour 1, legeres jour 2 apres-midi
    precips.push(dayOffset === 1 && hour >= 16 && hour <= 20 ? 0.4 : 0);

    humidities.push(
      Math.round(55 + 15 * Math.cos(((hour - 4) * Math.PI) / 12)),
    );
    pressures.push(1013 + Math.round(2 * Math.sin((i * Math.PI) / 24)));

    // UV : pic a midi, nul la nuit
    uvIndices.push(
      hour >= 7 && hour <= 19
        ? Math.round(5 * Math.sin(((hour - 7) * Math.PI) / 12))
        : 0,
    );
  }

  return {
    time: times,
    temperature_2m: temps,
    weather_code: codes,
    wind_speed_10m: winds,
    precipitation: precips,
    relative_humidity_2m: humidities,
    pressure_msl: pressures,
    uv_index: uvIndices,
    wind_direction_10m: windDirs,
    wind_gusts_10m: windGusts,
  };
}

/** Previsions journalieres sur 7 jours avec conditions variees. */
export const MOCK_DAILY: DailyForecast = {
  time: [
    "2026-04-09",
    "2026-04-10",
    "2026-04-11",
    "2026-04-12",
    "2026-04-13",
    "2026-04-14",
    "2026-04-15",
  ],
  weather_code: [2, 0, 0, 3, 61, 61, 2],
  temperature_2m_max: [18, 21, 23, 19, 16, 14, 17],
  temperature_2m_min: [11, 12, 14, 13, 10, 9, 10],
  sunrise: [
    "2026-04-09T07:05",
    "2026-04-10T07:03",
    "2026-04-11T07:01",
    "2026-04-12T06:59",
    "2026-04-13T06:57",
    "2026-04-14T06:55",
    "2026-04-15T06:53",
  ],
  sunset: [
    "2026-04-09T20:32",
    "2026-04-10T20:34",
    "2026-04-11T20:35",
    "2026-04-12T20:37",
    "2026-04-13T20:38",
    "2026-04-14T20:40",
    "2026-04-15T20:42",
  ],
  precipitation_sum: [0, 0, 0, 0.5, 8.2, 12.4, 1.1],
  uv_index_max: [3, 5, 6, 2, 1, 1, 4],
  wind_speed_10m_max: [14, 12, 10, 18, 25, 22, 15],
  wind_gusts_10m_max: [24, 20, 16, 30, 42, 38, 24],
  wind_direction_10m_dominant: [220, 200, 190, 250, 280, 300, 210],
};

/** Previsions horaires generees. */
export const MOCK_HOURLY: HourlyForecast = generateHourlyData();

/** Reponse complete combinant courant + horaire + journalier. */
export const MOCK_FORECAST: ForecastResponse = {
  current: MOCK_CURRENT,
  hourly: MOCK_HOURLY,
  daily: MOCK_DAILY,
};

/** Qualite de l'air : AQI 42, bon a correct. */
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

/** Icone meteo selon le code WMO. */
const WEATHER_ICONS: Record<number, string> = {
  0: "soleil.png",
  1: "soleil-et-nuage.png",
  2: "soleil-et-nuage.png",
  3: "nuage.png",
  45: "brouillard-de-jour.png",
  48: "brouillard-de-jour.png",
  51: "pluie.png",
  53: "pluie.png",
  55: "pluie.png",
  61: "pluie.png",
  63: "pluie-torrentielle.png",
  65: "pluie-torrentielle.png",
  80: "partiellement-nuageux-avec-pluie.png",
  95: "risques-de-tempête.png",
};

/** Noms de jours pour l'affichage du bandeau hebdomadaire. */
const DAY_LABELS = [
  $localize`:@@weather-pres.day.sun:Dim.`,
  $localize`:@@weather-pres.day.mon:Lun.`,
  $localize`:@@weather-pres.day.tue:Mar.`,
  $localize`:@@weather-pres.day.wed:Mer.`,
  $localize`:@@weather-pres.day.thu:Jeu.`,
  $localize`:@@weather-pres.day.fri:Ven.`,
  $localize`:@@weather-pres.day.sat:Sam.`,
];

/** Element du bandeau de previsions hebdomadaire. */
export interface WeekDay {
  date: string;
  label: string;
  icon: string;
  tempMax: number;
  tempMin: number;
  precipSum: number;
  weatherCode: number;
  isToday: boolean;
}

/**
 * Construit le tableau des 7 jours pour le bandeau hebdomadaire.
 * Le premier jour est marque comme "Auj." (aujourd'hui).
 */
export function buildWeekDays(daily: DailyForecast): WeekDay[] {
  return daily.time.map((dateStr, i) => {
    const d = new Date(dateStr + "T12:00:00");
    const dayIndex = d.getDay();
    return {
      date: dateStr,
      label:
        i === 0
          ? $localize`:@@weather-pres.day.today:Auj.`
          : DAY_LABELS[dayIndex],
      icon: `assets/images/meteo/${WEATHER_ICONS[daily.weather_code[i]] ?? "nuage.png"}`,
      tempMax: daily.temperature_2m_max[i],
      tempMin: daily.temperature_2m_min[i],
      precipSum: daily.precipitation_sum[i],
      weatherCode: daily.weather_code[i],
      isToday: i === 0,
    };
  });
}
