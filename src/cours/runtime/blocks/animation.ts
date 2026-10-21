import { prefereMouvementReduit } from '../core/mouvement';
import type { ParametreReglable } from './curseurs';

export type Reglages = Readonly<Record<string, number>>;

export const DUREE_ETAPE_MS = 3000;
const CHANGEMENTS_PAR_DEFAUT = 6;

function positionVers(parametre: ParametreReglable, depart: number, progression: number): number {
  const devant = parametre.positions.filter((position) => position >= depart);
  return devant[Math.round(progression * (devant.length - 1))] ?? depart;
}

export function changeQuelqueChose(
  parametres: readonly ParametreReglable[],
  courantes: Reglages,
  reglages: Reglages,
): boolean {
  return parametres.some((parametre) => {
    const pilote = reglages[parametre.cle];
    return typeof pilote === 'number' && pilote !== courantes[parametre.cle];
  });
}

export function poserEtape(
  parametres: readonly ParametreReglable[],
  courantes: Reglages,
  etape: Reglages,
): Record<string, number> {
  const posees: Record<string, number> = { ...courantes };
  for (const parametre of parametres) {
    const valeur = etape[parametre.cle];
    if (typeof valeur === 'number') {
      posees[parametre.cle] = valeur;
    }
  }
  return posees;
}

export function suiteVersLeMaximum(
  parametres: readonly ParametreReglable[],
  courantes: Reglages,
): Reglages[] {
  const suite: Reglages[] = [];
  const departs: Reglages = Object.fromEntries(
    parametres.map((parametre) => [parametre.cle, courantes[parametre.cle] ?? parametre.defaut]),
  );
  let precedente = departs;
  for (let changement = 1; changement <= CHANGEMENTS_PAR_DEFAUT; changement += 1) {
    const progression = changement / CHANGEMENTS_PAR_DEFAUT;
    const etape = Object.fromEntries(
      parametres.map((parametre) => [
        parametre.cle,
        positionVers(parametre, departs[parametre.cle], progression),
      ]),
    );
    if (parametres.some(({ cle }) => etape[cle] !== precedente[cle])) {
      suite.push(etape);
      precedente = etape;
    }
  }
  return suite;
}

export function jouerSuite(
  etapes: readonly Reglages[],
  appliquer: (etape: Reglages) => void,
  mouvementReduit: boolean = prefereMouvementReduit(),
): () => void {
  if (etapes.length === 0) {
    return () => undefined;
  }
  if (mouvementReduit) {
    appliquer(Object.assign({}, ...etapes) as Reglages);
    return () => undefined;
  }
  let minuterie: ReturnType<typeof setTimeout> | null = null;
  const jouer = (rang: number): void => {
    appliquer(etapes[rang]);
    minuterie = rang + 1 < etapes.length ? setTimeout(() => jouer(rang + 1), DUREE_ETAPE_MS) : null;
  };
  jouer(0);
  return () => {
    if (minuterie !== null) {
      clearTimeout(minuterie);
      minuterie = null;
    }
  };
}
