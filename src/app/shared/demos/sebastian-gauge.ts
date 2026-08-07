/**
 * Module pur (non-Angular) de la jauge de score et de la heatmap d'activite
 * Sebastian, partage entre le hub Atelier (`/atelier`, 28 cases, seuil bas 0.3)
 * et la landing Sebastian (`/atelier/sebastian`, 56 cases, seuil bas 0.32).
 *
 * Les seuils hauts (0.78 → niveau 3, 0.55 → niveau 2) sont communs aux deux
 * demos ; seuls la longueur de la heatmap et le seuil du niveau 1 sont
 * parametres. Comparaisons `>` strictes partout.
 */

/** Perimetre du cercle SVG de la jauge (r=40 → 2·π·40 ≈ 251). */
export const GAUGE_PERIMETER = 251;

/** Seuil du niveau 3 (commun aux deux demos). @internal */
const HIGH_THRESHOLD = 0.78;

/** Seuil du niveau 2 (commun aux deux demos). @internal */
const MID_THRESHOLD = 0.55;

/**
 * Mappe une valeur 0–1 vers un niveau de heatmap 0–3 selon les seuils.
 * Comparaisons `>` strictes : une valeur exactement sur un seuil retombe au
 * niveau inferieur.
 * @internal
 */
function toLevel(v: number, lowThreshold: number): number {
  return v > HIGH_THRESHOLD ? 3 : v > MID_THRESHOLD ? 2 : v > lowThreshold ? 1 : 0;
}

/**
 * `stroke-dashoffset` de la jauge pour une valeur 0–100.
 * @param value - Valeur courante (0–100).
 * @returns `251 − (value/100)·251` (251 = jauge vide, 0 = jauge pleine).
 */
export function gaugeOffset(value: number): number {
  return GAUGE_PERIMETER - (value / 100) * GAUGE_PERIMETER;
}

/**
 * Heatmap deterministe SSR-safe : v = (sin(i·1.7) + 1) / 2, seuils 0.78 → 3,
 * 0.55 → 2, `lowThreshold` → 1, sinon 0. Aucun `Math.random` : sequence stable
 * et hydratable.
 * @param length - Nombre de cases (28 hub, 56 landing).
 * @param lowThreshold - Seuil du niveau 1. Defaut 0.3.
 * @returns `number[]` de longueur `length`, valeurs 0–3.
 */
export function buildDeterministicHeatmap(length: number, lowThreshold = 0.3): number[] {
  return Array.from({ length }, (_, i) => {
    const v = (Math.sin(i * 1.7) + 1) / 2; // 0..1 deterministe
    return toLevel(v, lowThreshold);
  });
}

/**
 * Heatmap variee (`Math.random`), memes seuils que {@link buildDeterministicHeatmap}.
 * A n'appeler qu'en environnement navigateur cote appelant.
 * @param length - Nombre de cases.
 * @param lowThreshold - Seuil du niveau 1. Defaut 0.3.
 * @returns `number[]` de longueur `length`, valeurs 0–3.
 */
export function buildRandomHeatmap(length: number, lowThreshold = 0.3): number[] {
  return Array.from({ length }, () => toLevel(Math.random(), lowThreshold));
}
