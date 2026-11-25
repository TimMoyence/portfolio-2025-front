import { bornerEntre } from '../../../../../../cours/runtime/core/texte/valeurs';
import type { Boite } from '../formes';
import { ANNEAU, type Figure } from './figures';

export interface Sommet {
  readonly x: number;
  readonly y: number;
  readonly rayon: number;
}

const DEGRE = Math.PI / 180;
const PART_DE_LA_MARGE = 0.1;
const PERSEE = 10;
const FIGURE_DE_LA_PAGE = new Map([
  ['/', 0],
  ['/offer', 13],
  ['/projets', 9],
  ['/presentation', 4],
  ['/articles', 5],
]);

export const rayonDeLEtoile = (magnitude: number): number =>
  bornerEntre(3.2 - 0.55 * magnitude, 1.2, 3.4);

const ecart = (angle: number, reference: number): number =>
  ((((angle - reference) % 360) + 540) % 360) - 180;

const milieu = (valeurs: readonly number[]): number =>
  (Math.min(...valeurs) + Math.max(...valeurs)) / 2;

const etendue = (valeurs: readonly number[]): number => Math.max(...valeurs) - Math.min(...valeurs);

export const sommetsDuCiel = (
  { etoiles }: Figure,
  { left, top, width, height }: Boite,
): Sommet[] => {
  const [[reference]] = etoiles;
  const ascensions = etoiles.map(([ascension]) => ecart(ascension, reference));
  const declinaisons = etoiles.map(([, declinaison]) => declinaison);
  const ascensionCentrale = milieu(ascensions);
  const declinaisonCentrale = milieu(declinaisons);
  const xs = ascensions.map(
    (ascension) => -(ascension - ascensionCentrale) * Math.cos(declinaisonCentrale * DEGRE),
  );
  const ys = declinaisons.map((declinaison) => declinaisonCentrale - declinaison);
  const marge = PART_DE_LA_MARGE * Math.min(width, height);
  const echelle = Math.min((width - 2 * marge) / etendue(xs), (height - 2 * marge) / etendue(ys));
  return etoiles.map(([, , magnitude], index) => ({
    x: left + width / 2 + xs[index] * echelle,
    y: top + height / 2 + ys[index] * echelle,
    rayon: rayonDeLEtoile(magnitude),
  }));
};

export const figureDeLaPage = (url: string): number | undefined => {
  const [chemin] = url.split(/[?#]/);
  return /^\/articles\/[^/]+$/.test(chemin) ? PERSEE : FIGURE_DE_LA_PAGE.get(chemin);
};

export const figureDeLaSection = (page: number, section: number, bande: number): number =>
  (((page + section - bande) % ANNEAU.length) + ANNEAU.length) % ANNEAU.length;

export const sectionActive = (hauts: readonly number[], milieuDeLEcran: number): number =>
  hauts.reduce((active, haut, index) => (haut <= milieuDeLEcran ? index : active), 0);
