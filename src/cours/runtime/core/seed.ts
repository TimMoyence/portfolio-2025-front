export type Rng = () => number;

export function createRng(seed: number): Rng {
  let etat = seed | 0;
  return () => {
    etat = (etat + 0x6d2b79f5) | 0;
    let melange = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    melange = (melange + Math.imul(melange ^ (melange >>> 7), 61 | melange)) ^ melange;
    return ((melange ^ (melange >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
  const rng = createRng(seed);
  const copie = [...items];
  for (let index = copie.length - 1; index > 0; index -= 1) {
    const cible = Math.floor(rng() * (index + 1));
    [copie[index], copie[cible]] = [copie[cible], copie[index]];
  }
  return copie;
}

export function pickInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}
