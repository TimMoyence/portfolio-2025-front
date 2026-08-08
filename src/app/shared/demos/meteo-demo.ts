export const ARC = {
  cx: 95,
  cy: 92,
  r: 78,
  rayTop: 14,
} as const;

export interface DemoCity {
  readonly id: string;
  readonly name: string;
  readonly cond: string;
  readonly temp: number;
  readonly feels: number;
  readonly hum: number;
  readonly uv: number;
  readonly aqi: number;
  readonly aqiLabel: string;
  readonly wind: number;
  readonly windTxt: string;
  readonly windDeg: number;
  readonly sun: number;
  readonly sunrise: string;
  readonly sunset: string;
}

export interface MeteoCityLabels {
  readonly cond: string;
  readonly aqiLabel: string;
  readonly windTxt: string;
}

export type MeteoCityId = 'bordeaux' | 'paris' | 'nice' | 'lyon';

type MeteoCityCore = Omit<DemoCity, keyof MeteoCityLabels>;

const METEO_CITY_CORES: readonly MeteoCityCore[] = [
  {
    id: 'bordeaux',
    name: 'Bordeaux',
    temp: 19,
    feels: 18,
    hum: 64,
    uv: 4,
    aqi: 22,
    wind: 14,
    windDeg: 270,
    sun: 0.5,
    sunrise: '06:42',
    sunset: '21:18',
  },
  {
    id: 'paris',
    name: 'Paris',
    temp: 16,
    feels: 14,
    hum: 71,
    uv: 3,
    aqi: 34,
    wind: 18,
    windDeg: 0,
    sun: 0.32,
    sunrise: '06:31',
    sunset: '21:34',
  },
  {
    id: 'nice',
    name: 'Nice',
    temp: 24,
    feels: 25,
    hum: 52,
    uv: 7,
    aqi: 18,
    wind: 9,
    windDeg: 135,
    sun: 0.68,
    sunrise: '06:18',
    sunset: '21:06',
  },
  {
    id: 'lyon',
    name: 'Lyon',
    temp: 21,
    feels: 20,
    hum: 58,
    uv: 5,
    aqi: 27,
    wind: 12,
    windDeg: 180,
    sun: 0.45,
    sunrise: '06:25',
    sunset: '21:22',
  },
] as const;

export function createMeteoCities(
  labels: Record<MeteoCityId, MeteoCityLabels>,
): readonly DemoCity[] {
  return METEO_CITY_CORES.map((core) => ({
    ...core,
    ...labels[core.id as MeteoCityId],
  }));
}

export function needleTransform(windDeg: number): string {
  return `rotate(${windDeg}, 90, 90)`;
}

export function sunDot(sun: number): { x: number; y: number } {
  const angle = Math.PI * (1 - sun);
  return {
    x: ARC.cx - Math.cos(angle) * ARC.r,
    y: ARC.cy - Math.sin(angle) * (ARC.cy - ARC.rayTop),
  };
}
