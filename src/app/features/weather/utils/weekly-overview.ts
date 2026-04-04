import type {
  HourlyForecast,
  OverviewGranularity,
} from "../../../core/models/weather.model";

/** Creneau temporel agrege pour l'affichage weekly-overview. */
export interface WeatherTimeSlot {
  /** Label du creneau (date ISO pour day, datetime ISO pour 3h/1h). */
  label: string;
  /** Temperature moyenne sur le creneau. */
  avgTemp: number;
  /** Temperature minimale sur le creneau. */
  minTemp: number;
  /** Temperature maximale sur le creneau. */
  maxTemp: number;
  /** Precipitations cumulees sur le creneau (mm). */
  totalPrecipitation: number;
  /** Code meteo WMO dominant (le plus frequent). */
  dominantWeatherCode: number;
  /** Vitesse maximale du vent sur le creneau. */
  maxWind: number;
  /** Rafales maximales du vent sur le creneau. */
  maxGusts: number | null;
  /** Direction dominante du vent (degres). */
  windDirection: number | null;
  /** Humidite moyenne (%). */
  avgHumidity: number | null;
  /** Pression moyenne (hPa). */
  avgPressure: number | null;
  /** Nombre d'heures aggregees dans ce creneau. */
  hourCount: number;
}

/**
 * Groupe les donnees horaires selon la granularite choisie.
 * - `day` : un slot par jour
 * - `3h` : un slot par bloc de 3 heures
 * - `1h` : un slot par heure (pas d'aggregation)
 */
export function groupHourlyByGranularity(
  hourly: HourlyForecast,
  granularity: OverviewGranularity,
): WeatherTimeSlot[] {
  if (hourly.time.length === 0) return [];

  if (granularity === "1h") {
    return hourly.time.map((time, i) => ({
      label: time,
      avgTemp: hourly.temperature_2m[i],
      minTemp: hourly.temperature_2m[i],
      maxTemp: hourly.temperature_2m[i],
      totalPrecipitation: hourly.precipitation[i],
      dominantWeatherCode: hourly.weather_code[i],
      maxWind: hourly.wind_speed_10m[i],
      maxGusts: hourly.wind_gusts_10m?.[i] ?? null,
      windDirection: hourly.wind_direction_10m?.[i] ?? null,
      avgHumidity: hourly.relative_humidity_2m?.[i] ?? null,
      avgPressure: hourly.pressure_msl?.[i] ?? null,
      hourCount: 1,
    }));
  }

  const groups = groupIndices(hourly.time, granularity);

  return groups.map((indices) => {
    const temps = indices.map((i) => hourly.temperature_2m[i]);
    const precips = indices.map((i) => hourly.precipitation[i]);
    const codes = indices.map((i) => hourly.weather_code[i]);
    const winds = indices.map((i) => hourly.wind_speed_10m[i]);
    const gusts = hourly.wind_gusts_10m
      ? indices.map((i) => hourly.wind_gusts_10m![i])
      : null;
    const dirs = hourly.wind_direction_10m
      ? indices.map((i) => hourly.wind_direction_10m![i])
      : null;
    const humidities = hourly.relative_humidity_2m
      ? indices.map((i) => hourly.relative_humidity_2m![i])
      : null;
    const pressures = hourly.pressure_msl
      ? indices.map((i) => hourly.pressure_msl![i])
      : null;

    return {
      label:
        granularity === "day"
          ? hourly.time[indices[0]].slice(0, 10)
          : hourly.time[indices[0]],
      avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
      minTemp: Math.min(...temps),
      maxTemp: Math.max(...temps),
      totalPrecipitation: precips.reduce((a, b) => a + b, 0),
      dominantWeatherCode: modeStat(codes),
      maxWind: Math.max(...winds),
      maxGusts: gusts ? Math.max(...gusts) : null,
      windDirection: dirs ? modeStat(dirs) : null,
      avgHumidity: humidities
        ? Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length)
        : null,
      avgPressure: pressures
        ? Math.round(pressures.reduce((a, b) => a + b, 0) / pressures.length)
        : null,
      hourCount: indices.length,
    };
  });
}

/** Regroupe les indices horaires selon la granularite. */
function groupIndices(times: string[], granularity: "day" | "3h"): number[][] {
  if (granularity === "day") {
    const map = new Map<string, number[]>();
    for (let i = 0; i < times.length; i++) {
      const day = times[i].slice(0, 10);
      const group = map.get(day);
      if (group) {
        group.push(i);
      } else {
        map.set(day, [i]);
      }
    }
    return [...map.values()];
  }

  // granularite 3h : blocs consecutifs de 3
  const groups: number[][] = [];
  for (let i = 0; i < times.length; i += 3) {
    const end = Math.min(i + 3, times.length);
    const group: number[] = [];
    for (let j = i; j < end; j++) {
      group.push(j);
    }
    groups.push(group);
  }
  return groups;
}

/** Retourne la valeur la plus frequente (mode statistique). */
function modeStat(values: number[]): number {
  const counts = new Map<number, number>();
  let maxCount = 0;
  let mode = values[0];

  for (const v of values) {
    const c = (counts.get(v) ?? 0) + 1;
    counts.set(v, c);
    if (c > maxCount) {
      maxCount = c;
      mode = v;
    }
  }

  return mode;
}
