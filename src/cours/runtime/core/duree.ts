export const instantMonotone = (): number => performance.now();

export const dureeMonotoneDepuis = (debut: number): number =>
  Math.max(0, Math.round(performance.now() - debut));
