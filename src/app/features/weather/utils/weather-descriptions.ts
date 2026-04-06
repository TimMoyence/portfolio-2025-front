/**
 * Mapping des codes météo WMO vers des descriptions localisées.
 * Utilisé pour afficher les conditions météo dans la langue de l'utilisateur.
 * @see https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM
 */
export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: $localize`:weather.wmo.0|Clear sky@@wmo0:Ciel dégagé`,
    1: $localize`:weather.wmo.1|Mainly clear@@wmo1:Principalement dégagé`,
    2: $localize`:weather.wmo.2|Partly cloudy@@wmo2:Partiellement nuageux`,
    3: $localize`:weather.wmo.3|Overcast@@wmo3:Couvert`,
    45: $localize`:weather.wmo.45|Fog@@wmo45:Brouillard`,
    48: $localize`:weather.wmo.48|Depositing rime fog@@wmo48:Brouillard givrant`,
    51: $localize`:weather.wmo.51|Light drizzle@@wmo51:Bruine légère`,
    53: $localize`:weather.wmo.53|Moderate drizzle@@wmo53:Bruine modérée`,
    55: $localize`:weather.wmo.55|Dense drizzle@@wmo55:Bruine dense`,
    56: $localize`:weather.wmo.56|Light freezing drizzle@@wmo56:Bruine verglaçante légère`,
    57: $localize`:weather.wmo.57|Dense freezing drizzle@@wmo57:Bruine verglaçante dense`,
    61: $localize`:weather.wmo.61|Slight rain@@wmo61:Pluie légère`,
    63: $localize`:weather.wmo.63|Moderate rain@@wmo63:Pluie modérée`,
    65: $localize`:weather.wmo.65|Heavy rain@@wmo65:Pluie forte`,
    66: $localize`:weather.wmo.66|Light freezing rain@@wmo66:Pluie verglaçante légère`,
    67: $localize`:weather.wmo.67|Heavy freezing rain@@wmo67:Pluie verglaçante forte`,
    71: $localize`:weather.wmo.71|Slight snow@@wmo71:Neige légère`,
    73: $localize`:weather.wmo.73|Moderate snow@@wmo73:Neige modérée`,
    75: $localize`:weather.wmo.75|Heavy snow@@wmo75:Neige forte`,
    77: $localize`:weather.wmo.77|Snow grains@@wmo77:Grains de neige`,
    80: $localize`:weather.wmo.80|Slight rain showers@@wmo80:Averses légères`,
    81: $localize`:weather.wmo.81|Moderate rain showers@@wmo81:Averses modérées`,
    82: $localize`:weather.wmo.82|Violent rain showers@@wmo82:Averses violentes`,
    85: $localize`:weather.wmo.85|Slight snow showers@@wmo85:Averses de neige légères`,
    86: $localize`:weather.wmo.86|Heavy snow showers@@wmo86:Averses de neige fortes`,
    95: $localize`:weather.wmo.95|Thunderstorm@@wmo95:Orage`,
    96: $localize`:weather.wmo.96|Thunderstorm with slight hail@@wmo96:Orage avec grêle légère`,
    99: $localize`:weather.wmo.99|Thunderstorm with heavy hail@@wmo99:Orage avec grêle forte`,
  };
  return (
    descriptions[code] ??
    $localize`:weather.wmo.unknown|Unknown conditions@@wmoUnknown:Conditions inconnues`
  );
}
