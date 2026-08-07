/** Perimetre du cercle SVG de la jauge (r=40 → 2·π·40 ≈ 251). */
export const GAUGE_PERIMETER = 251;

const HIGH_THRESHOLD = 0.78;

const MID_THRESHOLD = 0.55;

function toLevel(v: number, lowThreshold: number): number {
  return v > HIGH_THRESHOLD ? 3 : v > MID_THRESHOLD ? 2 : v > lowThreshold ? 1 : 0;
}

export function gaugeOffset(value: number): number {
  return GAUGE_PERIMETER - (value / 100) * GAUGE_PERIMETER;
}

/** Aucun `Math.random` : la sequence doit rester stable entre SSR et hydratation. */
export function buildDeterministicHeatmap(length: number, lowThreshold = 0.3): number[] {
  return Array.from({ length }, (_, i) => {
    const v = (Math.sin(i * 1.7) + 1) / 2;
    return toLevel(v, lowThreshold);
  });
}

/** A n'appeler qu'en environnement navigateur : non hydratable (`Math.random`). */
export function buildRandomHeatmap(length: number, lowThreshold = 0.3): number[] {
  return Array.from({ length }, () => toLevel(Math.random(), lowThreshold));
}
