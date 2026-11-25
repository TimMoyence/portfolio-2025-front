import type { Position } from './voisins';

export interface Boite {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export type Lien = 'plein' | 'pointille';

const MARGE_DU_CONTOUR = 12;

export const liensDesEtapes = (centres: readonly Position[], hauteur: number): Lien[] =>
  centres.slice(1).map(({ y }) => (y < 0.6 * hauteur ? 'plein' : 'pointille'));

export const estTenue = (sommets: readonly Position[], largeur: number, hauteur: number): boolean =>
  sommets.filter(({ x, y }) => x >= 0 && x < largeur && y >= 0 && y < hauteur).length >=
  Math.ceil(sommets.length / 2);

export const traverse = (
  depart: Position,
  arrivee: Position,
  { left, top, width, height }: Boite,
): boolean => {
  const dx = arrivee.x - depart.x;
  const dy = arrivee.y - depart.y;
  let entree = 0;
  let sortie = 1;
  for (const [pente, ecart] of [
    [-dx, depart.x - left],
    [dx, left + width - depart.x],
    [-dy, depart.y - top],
    [dy, top + height - depart.y],
  ]) {
    if (pente === 0 && ecart < 0) return false;
    if (pente < 0) entree = Math.max(entree, ecart / pente);
    if (pente > 0) sortie = Math.min(sortie, ecart / pente);
  }
  return entree <= sortie;
};

const VOILE_DU_TEXTE = 0.25;

export const voile = (depart: Position, arrivee: Position, blocs: readonly Boite[]): number =>
  blocs.some((bloc) => traverse(depart, arrivee, bloc)) ? VOILE_DU_TEXTE : 1;

export const sommetsDuContour = ({ left, top, width, height }: Boite): Position[] => {
  const gauche = left - MARGE_DU_CONTOUR;
  const haut = top - MARGE_DU_CONTOUR;
  const droite = left + width + MARGE_DU_CONTOUR;
  const bas = top + height + MARGE_DU_CONTOUR;
  const milieuX = left + width / 2;
  const milieuY = top + height / 2;
  return [
    { x: gauche, y: haut },
    { x: milieuX, y: haut },
    { x: droite, y: haut },
    { x: droite, y: milieuY },
    { x: droite, y: bas },
    { x: milieuX, y: bas },
    { x: gauche, y: bas },
    { x: gauche, y: milieuY },
  ];
};
