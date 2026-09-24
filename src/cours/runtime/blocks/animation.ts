import type { ParametreReglable } from './curseurs';

export type Reglages = Readonly<Record<string, number>>;

export const DUREE_ETAPE_MS = 3000;
const CHANGEMENTS_PAR_DEFAUT = 6;
const PRECISION = 1e9;

export function borner(parametre: ParametreReglable, valeur: number): number {
  const bas = Number.isFinite(parametre.min) ? parametre.min : 0;
  const haut = Math.max(Number.isFinite(parametre.max) ? parametre.max : bas, bas);
  return Math.min(Math.max(Number.isFinite(valeur) ? valeur : bas, bas), haut);
}

export function caler(parametre: ParametreReglable, valeur: number): number {
  const borne = borner(parametre, valeur);
  if (!Number.isFinite(parametre.pas) || parametre.pas <= 0) {
    return borne;
  }
  const bas = borner(parametre, parametre.min);
  const cale = bas + Math.round((borne - bas) / parametre.pas) * parametre.pas;
  return borner(parametre, Math.round(cale * PRECISION) / PRECISION);
}

export function changeQuelqueChose(
  parametres: readonly ParametreReglable[],
  courantes: Reglages,
  reglages: Reglages,
): boolean {
  return parametres.some((parametre) => {
    const pilote = reglages[parametre.cle];
    return typeof pilote === 'number' && borner(parametre, pilote) !== courantes[parametre.cle];
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
      posees[parametre.cle] = caler(parametre, valeur);
    }
  }
  return posees;
}

export function suiteVersLeMaximum(
  parametres: readonly ParametreReglable[],
  courantes: Reglages,
): Reglages[] {
  const suite: Reglages[] = [];
  let precedente: Reglages = Object.fromEntries(
    parametres.map((parametre) => [
      parametre.cle,
      caler(parametre, courantes[parametre.cle] ?? parametre.defaut),
    ]),
  );
  for (let changement = 1; changement <= CHANGEMENTS_PAR_DEFAUT; changement += 1) {
    const progression = changement / CHANGEMENTS_PAR_DEFAUT;
    const etape = Object.fromEntries(
      parametres.map((parametre) => {
        const depart = caler(parametre, courantes[parametre.cle] ?? parametre.defaut);
        const haut = borner(parametre, parametre.max);
        return [parametre.cle, caler(parametre, depart + (haut - depart) * progression)];
      }),
    );
    if (parametres.some(({ cle }) => etape[cle] !== precedente[cle])) {
      suite.push(etape);
      precedente = etape;
    }
  }
  return suite;
}

function prefereMouvementReduit(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
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
