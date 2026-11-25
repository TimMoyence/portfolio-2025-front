import { bornerEntre } from '../../../../../cours/runtime/core/texte/valeurs';
import type { Position } from './voisins';

export interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rayon: number;
  lumineux: boolean;
  phase: number;
  ne: boolean;
  opacite: number;
  cible: number;
}

export interface Demande {
  readonly cle: string;
  readonly sommets: readonly Position[];
}

export interface Forme {
  readonly cle: string;
  sommets: readonly Position[];
  readonly points: readonly Point[];
}

export interface Champ {
  largeur: number;
  hauteur: number;
  readonly points: Point[];
  formes: Forme[];
  partants: Point[];
  readonly suspendues: Set<string>;
}

const LIBRES_GARDES = 6;
const DUREE_DU_FONDU = 0.4;
const RAYON_D_UN_POINT_NE = 2;
const LARGEUR_DES_PETITS_ECRANS = 768;

export const nombreDePoints = (largeur: number, hauteur: number): number =>
  Math.round(
    bornerEntre((largeur * hauteur) / 22000, 18, largeur < LARGEUR_DES_PETITS_ECRANS ? 46 : 80),
  );

const nouveauPoint = (largeur: number, hauteur: number, hasard: () => number): Point => ({
  x: hasard() * largeur,
  y: hasard() * hauteur,
  vx: (hasard() - 0.5) * 0.2,
  vy: (hasard() - 0.5) * 0.2,
  rayon: hasard() * 2.04 + 1.2,
  lumineux: hasard() < 0.14,
  phase: hasard() * Math.PI * 2,
  ne: false,
  opacite: 1,
  cible: 1,
});

const naitre = ({ x, y }: Position): Point => ({
  x,
  y,
  vx: 0,
  vy: 0,
  rayon: RAYON_D_UN_POINT_NE,
  lumineux: false,
  phase: 0,
  ne: true,
  opacite: 0,
  cible: 1,
});

const pointsTenus = (formes: readonly Forme[]): Set<Point> =>
  new Set(formes.flatMap(({ points }) => points));

const libresParmi = (champ: Champ, formes: readonly Forme[]): Point[] => {
  const tenus = pointsTenus(formes);
  return champ.points.filter((point) => !tenus.has(point));
};

export const pointsLibres = (champ: Champ): Point[] => libresParmi(champ, champ.formes);

const indexDuPlusProche = (libres: readonly Point[], { x, y }: Position): number => {
  let meilleur = 0;
  libres.forEach((point, index) => {
    if (
      Math.hypot(point.x - x, point.y - y) <
      Math.hypot(libres[meilleur].x - x, libres[meilleur].y - y)
    ) {
      meilleur = index;
    }
  });
  return meilleur;
};

const prendre = (champ: Champ, { cle, sommets }: Demande, formes: readonly Forme[]): Forme => {
  const libres = libresParmi(champ, formes);
  return {
    cle,
    sommets,
    points: sommets.map((sommet) =>
      libres.length > LIBRES_GARDES
        ? libres.splice(indexDuPlusProche(libres, sommet), 1)[0]
        : naitre(sommet),
    ),
  };
};

const relacher = (champ: Champ, forme: Forme): void => {
  for (const point of forme.points.filter(({ ne }) => ne)) {
    point.cible = 0;
    champ.partants.push(point);
  }
};

export const tenirLesFormes = (champ: Champ, demandes: readonly Demande[]): void => {
  const cles = new Set(demandes.map(({ cle }) => cle));
  for (const cle of champ.suspendues) {
    if (!cles.has(cle)) champ.suspendues.delete(cle);
  }
  const retenues = demandes.filter(({ cle }) => !champ.suspendues.has(cle));
  const gardees = champ.formes.filter((forme) => {
    const demande = retenues.find(({ cle }) => cle === forme.cle);
    if (demande?.sommets.length === forme.points.length) {
      forme.sommets = demande.sommets;
      return true;
    }
    relacher(champ, forme);
    return false;
  });
  const formes: Forme[] = [];
  for (const demande of retenues) {
    const gardee = gardees.find(({ cle }) => cle === demande.cle);
    formes.push(gardee ?? prendre(champ, demande, [...gardees, ...formes]));
  }
  champ.formes = formes;
};

const RESSORT = 0.12;

export const rapprocher = (
  point: { x: number; y: number },
  { x, y }: Position,
  reduit: boolean,
): void => {
  point.x = reduit ? x : point.x + (x - point.x) * RESSORT;
  point.y = reduit ? y : point.y + (y - point.y) * RESSORT;
};

interface Fondant {
  opacite: number;
  readonly cible: number;
}

export const dureeDuFondu = (secondes: number, reduit: boolean): number =>
  reduit ? Infinity : secondes;

export const fondre = (point: Fondant, secondes: number): void => {
  const pas = secondes / DUREE_DU_FONDU;
  point.opacite =
    point.cible > point.opacite
      ? Math.min(point.cible, point.opacite + pas)
      : Math.max(point.cible, point.opacite - pas);
};

export const fondreLesPartants = <T extends Fondant>(
  partants: readonly T[],
  secondes: number,
): T[] => {
  for (const point of partants) fondre(point, secondes);
  return partants.filter(({ opacite }) => opacite > 0);
};

export const estomper = (champ: Champ, secondes: number): void => {
  for (const point of champ.formes.flatMap(({ points }) => points)) {
    if (point.ne) fondre(point, secondes);
  }
  champ.partants = fondreLesPartants(champ.partants, secondes);
};

const retirerDesLibres = (champ: Champ, voulu: number): void => {
  const tenus = pointsTenus(champ.formes);
  let libres = pointsLibres(champ).length;
  for (let index = champ.points.length - 1; index >= 0; index--) {
    if (champ.points.length <= voulu || libres <= LIBRES_GARDES) return;
    if (!tenus.has(champ.points[index])) {
      champ.points.splice(index, 1);
      libres--;
    }
  }
};

const ajusterLeNombre = (champ: Champ, hasard: () => number): void => {
  const voulu = nombreDePoints(champ.largeur, champ.hauteur);
  if (voulu > champ.points.length) champ.suspendues.clear();
  retirerDesLibres(champ, voulu);
  while (champ.points.length > voulu && champ.formes.length > 0) {
    const derniere = champ.formes[champ.formes.length - 1];
    champ.formes = champ.formes.slice(0, -1);
    relacher(champ, derniere);
    champ.suspendues.add(derniere.cle);
    retirerDesLibres(champ, voulu);
  }
  while (champ.points.length < voulu) {
    champ.points.push(nouveauPoint(champ.largeur, champ.hauteur, hasard));
  }
};

export const creerChamp = (largeur: number, hauteur: number, hasard: () => number): Champ => {
  const champ: Champ = {
    largeur,
    hauteur,
    points: [],
    formes: [],
    partants: [],
    suspendues: new Set<string>(),
  };
  ajusterLeNombre(champ, hasard);
  return champ;
};

export const redimensionner = (
  champ: Champ,
  largeur: number,
  hauteur: number,
  hasard: () => number,
): void => {
  const echelleX = largeur / champ.largeur;
  const echelleY = hauteur / champ.hauteur;
  for (const point of [...champ.points, ...champ.partants]) {
    point.x *= echelleX;
    point.y *= echelleY;
  }
  champ.largeur = largeur;
  champ.hauteur = hauteur;
  ajusterLeNombre(champ, hasard);
};
