import { position, type Plage } from './axe-gradue';

export interface Droite {
  readonly slope: number;
  readonly intercept: number;
}

interface SegmentTrace {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

function abscissesDansLeCadre(
  { slope, intercept }: Droite,
  [xMin, xMax]: Plage,
  [yMin, yMax]: Plage,
): Plage | null {
  if (slope === 0) {
    return intercept >= yMin && intercept <= yMax ? [xMin, xMax] : null;
  }
  const auPlancher = (yMin - intercept) / slope;
  const auPlafond = (yMax - intercept) / slope;
  const debut = Math.max(xMin, Math.min(auPlancher, auPlafond));
  const fin = Math.min(xMax, Math.max(auPlancher, auPlafond));
  return debut < fin ? [debut, fin] : null;
}

export function segmentDansLeCadre(
  droite: Droite,
  plageX: Plage,
  plageY: Plage,
  [debutVu, finVue]: Plage = plageX,
): SegmentTrace | null {
  const fenetre: Plage = [Math.max(plageX[0], debutVu), Math.min(plageX[1], finVue)];
  const abscisses = fenetre[0] < fenetre[1] ? abscissesDansLeCadre(droite, fenetre, plageY) : null;
  if (abscisses === null) {
    return null;
  }
  const [debut, fin] = abscisses;
  const hauteur = (x: number): number =>
    100 - position(droite.slope * x + droite.intercept, plageY);
  return {
    x1: position(debut, plageX),
    y1: hauteur(debut),
    x2: position(fin, plageX),
    y2: hauteur(fin),
  };
}
