import { dureeDuFondu, fondre, fondreLesPartants, rapprocher } from '../champ';
import { voile, type Boite } from '../formes';
import type { Sommet } from './ciel';
import { ANNEAU } from './figures';

export interface EtoileDuCiel {
  x: number;
  y: number;
  rayon: number;
  opacite: number;
  cible: number;
}

export interface Ciel {
  figure: number | undefined;
  section: string | undefined;
  places: readonly Sommet[];
  etoiles: EtoileDuCiel[];
  partantes: EtoileDuCiel[];
  trace: number;
  temps: number;
}

const OPACITE_DES_TRAITS = 0.2;
const OPACITE_DES_ETOILES = 0.5;
const SCINTILLEMENT = 0.1;
const CADENCE_DU_SCINTILLEMENT = 1.6;
const ANGLE_D_OR = Math.PI * (3 - Math.sqrt(5));
const DUREE_DU_TRACE = 1.5;

export const cielVide = (): Ciel => ({
  figure: undefined,
  section: undefined,
  places: [],
  etoiles: [],
  partantes: [],
  trace: 0,
  temps: 0,
});

const changerDeFigure = (ciel: Ciel, figure: number | undefined, sommets: readonly Sommet[]) => {
  const partantes = ciel.etoiles.slice(sommets.length);
  for (const etoile of partantes) etoile.cible = 0;
  ciel.partantes.push(...partantes);
  ciel.etoiles = [
    ...ciel.etoiles.slice(0, sommets.length),
    ...sommets
      .slice(ciel.etoiles.length)
      .map(({ x, y, rayon }) => ({ x, y, rayon, opacite: 0, cible: 1 })),
  ];
  ciel.figure = figure;
  ciel.trace = 0;
};

export interface Place {
  readonly figure: number;
  readonly section: string;
}

export const suivreLeCiel = (
  ciel: Ciel,
  place: Place | undefined,
  sommets: readonly Sommet[],
  secondes: number,
  reduit: boolean,
): void => {
  const figure = place?.figure;
  if (figure !== ciel.figure) changerDeFigure(ciel, figure, sommets);
  const anciennes = place?.section === ciel.section ? ciel.places : [];
  ciel.section = place?.section;
  ciel.places = sommets;
  const duree = dureeDuFondu(secondes, reduit);
  ciel.etoiles.forEach((etoile, index) => {
    const sommet = sommets[index];
    const ancienne = anciennes[index] ?? sommet;
    etoile.x += sommet.x - ancienne.x;
    etoile.y += sommet.y - ancienne.y;
    etoile.rayon = sommet.rayon;
    rapprocher(etoile, sommet, reduit);
    fondre(etoile, duree);
  });
  ciel.partantes = fondreLesPartants(ciel.partantes, duree);
  ciel.trace = Math.min(1, ciel.trace + duree / DUREE_DU_TRACE);
  ciel.temps += reduit ? 0 : secondes;
};

const tracerLesSegments = (
  { figure, etoiles, trace }: Ciel,
  contexte: CanvasRenderingContext2D,
  voiles: readonly Boite[],
) => {
  if (figure === undefined) return;
  const { segments } = ANNEAU[figure];
  segments.forEach(([depart, arrivee], index) => {
    const part = Math.min(1, trace * segments.length - index);
    if (part <= 0) return;
    const de = etoiles[depart];
    const vers = {
      x: de.x + (etoiles[arrivee].x - de.x) * part,
      y: de.y + (etoiles[arrivee].y - de.y) * part,
    };
    contexte.globalAlpha =
      OPACITE_DES_TRAITS * Math.min(de.opacite, etoiles[arrivee].opacite) * voile(de, vers, voiles);
    contexte.beginPath();
    contexte.moveTo(de.x, de.y);
    contexte.lineTo(vers.x, vers.y);
    contexte.stroke();
  });
};

export const dessinerLeCiel = (
  contexte: CanvasRenderingContext2D,
  ciel: Ciel,
  couleur: string,
  reduit: boolean,
  voiles: readonly Boite[],
): void => {
  contexte.strokeStyle = couleur;
  contexte.fillStyle = couleur;
  tracerLesSegments(ciel, contexte, voiles);
  [...ciel.etoiles, ...ciel.partantes].forEach((etoile, index) => {
    const { x, y, rayon, opacite } = etoile;
    const scintillement = reduit
      ? 0
      : SCINTILLEMENT * Math.sin(ciel.temps * CADENCE_DU_SCINTILLEMENT + index * ANGLE_D_OR);
    contexte.globalAlpha =
      (OPACITE_DES_ETOILES + scintillement) * opacite * voile(etoile, etoile, voiles);
    contexte.beginPath();
    contexte.arc(x, y, rayon, 0, Math.PI * 2);
    contexte.fill();
  });
};
