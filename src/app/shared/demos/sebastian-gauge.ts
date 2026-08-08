export const GAUGE_PERIMETER = 251;

const HIGH_THRESHOLD = 0.78;

const MID_THRESHOLD = 0.55;

function toLevel(value: number, lowThreshold: number): number {
  if (value > HIGH_THRESHOLD) {
    return 3;
  }
  if (value > MID_THRESHOLD) {
    return 2;
  }
  return value > lowThreshold ? 1 : 0;
}

export function gaugeOffset(value: number): number {
  return GAUGE_PERIMETER - (value / 100) * GAUGE_PERIMETER;
}

export function buildDeterministicHeatmap(length: number, lowThreshold = 0.3): number[] {
  return Array.from({ length }, (_, i) => {
    const v = (Math.sin(i * 1.7) + 1) / 2;
    return toLevel(v, lowThreshold);
  });
}

export function buildRandomHeatmap(length: number, lowThreshold = 0.3): number[] {
  // eslint-disable-next-line sonarjs/pseudo-random -- heatmap decorative de demo, aucun usage cryptographique
  return Array.from({ length }, () => toLevel(Math.random(), lowThreshold));
}
