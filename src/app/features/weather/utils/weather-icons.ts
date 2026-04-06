import { getWeatherDescription } from "./weather-descriptions";

/**
 * @deprecated Utiliser {@link getWeatherDescription} directement.
 * Re-export pour compatibilite avec les imports existants.
 */
export const weatherCodeToDescription = getWeatherDescription;

/**
 * Mappe un code meteo WMO vers le fichier PNG correspondant.
 * @see https://open-meteo.com/en/docs#weathervariables
 */
export function weatherCodeToIcon(code: number, isNight = false): string {
  const base = "/assets/images/meteo/";

  if (code === 0)
    return base + (isNight ? "lune-et-étoiles.png" : "soleil.png");
  if (code === 1)
    return (
      base +
      (isNight ? "nuit-partiellement-nuageuse.png" : "soleil-et-nuage.png")
    );
  if (code === 2) return base + "soleil-et-nuage.png";
  if (code === 3) return base + "nuage.png";
  if (code >= 45 && code <= 48) return base + "brouillard-de-jour.png";
  if (code >= 51 && code <= 55)
    return base + "partiellement-nuageux-avec-pluie.png";
  if (code >= 56 && code <= 57) return base + "pluie.png";
  if (code >= 61 && code <= 65) return base + "pluie.png";
  if (code >= 66 && code <= 67) return base + "pluie-torrentielle.png";
  if (code >= 71 && code <= 77) return base + "pluie.png";
  if (code >= 80 && code <= 82) return base + "pluie-torrentielle.png";
  if (code >= 85 && code <= 86) return base + "pluie-torrentielle.png";
  if (code >= 95 && code <= 99) return base + "éclair-dans-un-nuage.png";

  return base + "nuage.png";
}
