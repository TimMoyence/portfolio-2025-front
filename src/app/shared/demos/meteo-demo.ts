/**
 * Module pur (non-Angular) de la demo meteo jouable partagee entre le hub
 * Atelier (`/atelier`) et la landing Meteo (`/atelier/meteo`).
 *
 * Les deux composants exposent des donnees numeriques fictives strictement
 * identiques (4 villes, geometrie de l'arc solaire, helpers boussole/soleil).
 * Seuls les 3 champs localises (`cond`, `aqiLabel`, `windTxt`) divergent : leurs
 * IDs de traduction `$localize` (`@@atelierMeteo*` vs `@@weatherLanding*`) sont
 * distincts et doivent rester LOCAUX aux composants. La factory
 * {@link createMeteoCities} zippe donc les coeurs numeriques partages avec les
 * libelles i18n fournis par l'appelant.
 */

/** Geometrie de l'arc solaire (calque du SVG `solar` de la maquette). */
export const ARC = {
  cx: 95,
  cy: 92,
  r: 78,
  rayTop: 14,
} as const;

/**
 * Donnees meteo simulees pour une ville de la demo jouable.
 * Toutes les valeurs sont fictives et autonomes : la demo ne depend d'aucune
 * des vraies apps (Lots 4/5) ni d'un appel reseau.
 */
export interface DemoCity {
  /** Identifiant technique (clef du bouton). */
  readonly id: string;
  /** Nom affiche de la ville. */
  readonly name: string;
  /** Condition meteo resumee, localisee (ex. « Ciel voile · brise d'ouest »). */
  readonly cond: string;
  /** Temperature en degres (entier). */
  readonly temp: number;
  /** Temperature ressentie en degres (entier). */
  readonly feels: number;
  /** Humidite relative en pourcent. */
  readonly hum: number;
  /** Indice UV (0–11). */
  readonly uv: number;
  /** Indice de qualite de l'air (european AQI). */
  readonly aqi: number;
  /** Libelle qualitatif de l'AQI, localise (ex. « Bon »). */
  readonly aqiLabel: string;
  /** Vitesse du vent en km/h. */
  readonly wind: number;
  /** Direction cardinale du vent, localisee (ex. « O »). */
  readonly windTxt: string;
  /** Angle de la boussole en degres (0 = N, sens horaire). */
  readonly windDeg: number;
  /** Progression du soleil dans l'arc, 0 (lever) → 1 (coucher). */
  readonly sun: number;
  /** Heure de lever du soleil affichee. */
  readonly sunrise: string;
  /** Heure de coucher du soleil affichee. */
  readonly sunset: string;
}

/**
 * Libelles i18n par ville, fournis par le composant (restent `$localize`
 * LOCAUX car les IDs de traduction divergent entre atelier et landing).
 */
export interface MeteoCityLabels {
  /** Condition meteo localisee. */
  readonly cond: string;
  /** Libelle qualitatif de l'AQI localise. */
  readonly aqiLabel: string;
  /** Direction cardinale du vent localisee. */
  readonly windTxt: string;
}

/** Identifiants des 4 villes par defaut, dans l'ordre d'affichage. */
export type MeteoCityId = "bordeaux" | "paris" | "nice" | "lyon";

/**
 * Coeur numerique partage d'une ville (tout sauf les 3 champs i18n).
 * @internal
 */
type MeteoCityCore = Omit<DemoCity, keyof MeteoCityLabels>;

/**
 * Valeurs numeriques fictives partagees des 4 villes (ordre d'affichage).
 * Strictement identiques entre le hub Atelier et la landing Meteo.
 * @internal
 */
const METEO_CITY_CORES: readonly MeteoCityCore[] = [
  {
    id: "bordeaux",
    name: "Bordeaux",
    temp: 19,
    feels: 18,
    hum: 64,
    uv: 4,
    aqi: 22,
    wind: 14,
    windDeg: 270,
    sun: 0.5,
    sunrise: "06:42",
    sunset: "21:18",
  },
  {
    id: "paris",
    name: "Paris",
    temp: 16,
    feels: 14,
    hum: 71,
    uv: 3,
    aqi: 34,
    wind: 18,
    windDeg: 0,
    sun: 0.32,
    sunrise: "06:31",
    sunset: "21:34",
  },
  {
    id: "nice",
    name: "Nice",
    temp: 24,
    feels: 25,
    hum: 52,
    uv: 7,
    aqi: 18,
    wind: 9,
    windDeg: 135,
    sun: 0.68,
    sunrise: "06:18",
    sunset: "21:06",
  },
  {
    id: "lyon",
    name: "Lyon",
    temp: 21,
    feels: 20,
    hum: 58,
    uv: 5,
    aqi: 27,
    wind: 12,
    windDeg: 180,
    sun: 0.45,
    sunrise: "06:25",
    sunset: "21:22",
  },
] as const;

/**
 * Construit les 4 villes de demo (valeurs numeriques fictives partagees,
 * ordre bordeaux→paris→nice→lyon) en injectant les libelles i18n fournis par
 * l'appelant. Invariant : memes valeurs numeriques que les composants.
 *
 * @param labels - Map id→{cond, aqiLabel, windTxt} localises (les 4 clefs requises).
 * @returns Tableau readonly de 4 {@link DemoCity}.
 */
export function createMeteoCities(
  labels: Record<MeteoCityId, MeteoCityLabels>,
): readonly DemoCity[] {
  return METEO_CITY_CORES.map((core) => ({
    ...core,
    ...labels[core.id as MeteoCityId],
  }));
}

/**
 * Transformation SVG de l'aiguille de la boussole.
 * @param windDeg - Angle du vent (0 = N, sens horaire).
 * @returns ex. `"rotate(270, 90, 90)"` (pivot au centre 90,90).
 */
export function needleTransform(windDeg: number): string {
  return `rotate(${windDeg}, 90, 90)`;
}

/**
 * Coordonnees (x, y) du soleil sur l'arc (calque {@link ARC}).
 * angle = π·(1 − sun) ; x = cx − cos(angle)·r ; y = cy − sin(angle)·(cy − rayTop).
 * @param sun - Progression 0 (lever) → 1 (coucher).
 * @returns Coordonnees du point soleil.
 */
export function sunDot(sun: number): { x: number; y: number } {
  const angle = Math.PI * (1 - sun); // 0 (gauche) → PI (droite)
  return {
    x: ARC.cx - Math.cos(angle) * ARC.r,
    y: ARC.cy - Math.sin(angle) * (ARC.cy - ARC.rayTop),
  };
}
