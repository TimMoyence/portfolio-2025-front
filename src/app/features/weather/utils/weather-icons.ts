const ICON_BASE = '/assets/images/meteo/';
const FALLBACK_ICON = 'nuage.png';

const NIGHT_ICON_BY_CODE: ReadonlyMap<number, string> = new Map([
  [0, 'lune-et-étoiles.png'],
  [1, 'nuit-partiellement-nuageuse.png'],
]);

interface IconRange {
  readonly from: number;
  readonly to: number;
  readonly icon: string;
}

const ICON_RANGES: readonly IconRange[] = [
  { from: 0, to: 0, icon: 'soleil.png' },
  { from: 1, to: 2, icon: 'soleil-et-nuage.png' },
  { from: 3, to: 3, icon: 'nuage.png' },
  { from: 45, to: 48, icon: 'brouillard-de-jour.png' },
  { from: 51, to: 55, icon: 'partiellement-nuageux-avec-pluie.png' },
  { from: 56, to: 57, icon: 'pluie.png' },
  { from: 61, to: 65, icon: 'pluie.png' },
  { from: 66, to: 67, icon: 'pluie-torrentielle.png' },
  { from: 71, to: 77, icon: 'pluie.png' },
  { from: 80, to: 82, icon: 'pluie-torrentielle.png' },
  { from: 85, to: 86, icon: 'pluie-torrentielle.png' },
  { from: 95, to: 99, icon: 'éclair-dans-un-nuage.png' },
];

/**
 * @see https://open-meteo.com/en/docs#weathervariables
 */
export function weatherCodeToIcon(code: number, isNight = false): string {
  const nightIcon = isNight ? NIGHT_ICON_BY_CODE.get(code) : undefined;
  const dayIcon = ICON_RANGES.find((range) => code >= range.from && code <= range.to)?.icon;
  return ICON_BASE + (nightIcon ?? dayIcon ?? FALLBACK_ICON);
}
