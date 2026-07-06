/**
 * Contraint une valeur dans l'intervalle [min, max].
 *
 * Equivalent strict de l'expression imbriquee `Math.max(min, Math.min(max, value))` :
 * si `min > max`, c'est `min` qui l'emporte (bornes inversees non corrigees) ;
 * si `value` est `NaN`, le resultat est `NaN` (aucune normalisation).
 *
 * @param value - Valeur a contraindre
 * @param min - Borne inferieure
 * @param max - Borne superieure
 * @returns La valeur contrainte dans [min, max]
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
