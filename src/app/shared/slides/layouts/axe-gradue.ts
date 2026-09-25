export type Plage = readonly [number, number];

export interface Graduation {
  readonly libelle: string;
  readonly position: number;
}

const PAS_RONDS = [1, 2, 2.5, 3, 5];
const INTERVALLES_MIN = 3;
const INTERVALLES_MAX = 8;
const GRADUATIONS_DE_REPLI = 5;

export const INTERVALLES_VISES = 5;
export const PRECISION = 1e-6;
export const NOMBRE_FRANCAIS = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

export function arrondir(valeur: number): number {
  return Math.round(valeur * 1e4) / 1e4;
}

function estEntier(valeur: number): boolean {
  return Math.abs(valeur - Math.round(valeur)) < PRECISION * Math.max(1, Math.abs(valeur));
}

export function position(valeur: number, [min, max]: Plage): number {
  const part = ((valeur - min) / Math.max(max - min, Number.EPSILON)) * 100;
  return arrondir(Math.min(Math.max(part, 0), 100));
}

function pasRond([min, max]: Plage): number | null {
  const etendue = max - min;
  const exposant = Math.floor(Math.log10(etendue / INTERVALLES_MAX));
  const candidats = [exposant, exposant + 1, exposant + 2].flatMap((puissance) =>
    PAS_RONDS.map((facteur) => facteur * 10 ** puissance),
  );
  const retenus = candidats.filter((pas) => {
    const intervalles = etendue / pas;
    return (
      estEntier(intervalles) &&
      estEntier(min / pas) &&
      Math.round(intervalles) >= INTERVALLES_MIN &&
      Math.round(intervalles) <= INTERVALLES_MAX
    );
  });
  const ecart = (pas: number): number => Math.abs(etendue / pas - INTERVALLES_VISES);
  return retenus.reduce<number | null>(
    (meilleur, pas) =>
      meilleur === null || ecart(pas) < ecart(meilleur) - PRECISION ? pas : meilleur,
    null,
  );
}

export function valeursGraduees(plage: Plage): readonly number[] {
  const [min, max] = plage;
  if (max <= min) {
    return [min];
  }
  const pas = pasRond(plage);
  const intervalles = pas === null ? GRADUATIONS_DE_REPLI - 1 : Math.round((max - min) / pas);
  return Array.from({ length: intervalles + 1 }, (_, rang) =>
    arrondir(min + ((max - min) * rang) / intervalles),
  );
}
