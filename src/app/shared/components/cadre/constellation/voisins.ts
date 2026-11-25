export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface Trait {
  readonly a: number;
  readonly b: number;
  readonly distance: number;
}

const DISTANCE_DES_TRAITS = 166;

const OPACITE_MAXIMALE = 0.43;

export const opaciteDuTrait = (distance: number): number =>
  distance < DISTANCE_DES_TRAITS ? (1 - distance / DISTANCE_DES_TRAITS) * OPACITE_MAXIMALE : 0;

const cellule = (valeur: number): number => Math.floor(valeur / DISTANCE_DES_TRAITS);

export const traitsParGrille = (positions: readonly Position[]): Trait[] => {
  const grille = new Map<string, number[]>();
  positions.forEach(({ x, y }, index) => {
    const cle = `${cellule(x)},${cellule(y)}`;
    grille.set(cle, [...(grille.get(cle) ?? []), index]);
  });
  const traits: Trait[] = [];
  positions.forEach(({ x, y }, a) => {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const b of grille.get(`${cellule(x) + dx},${cellule(y) + dy}`) ?? []) {
          const distance = Math.hypot(x - positions[b].x, y - positions[b].y);
          if (b > a && distance < DISTANCE_DES_TRAITS) {
            traits.push({ a, b, distance });
          }
        }
      }
    }
  });
  return traits;
};
