export const REQUETE_MOUVEMENT_REDUIT = '(prefers-reduced-motion: reduce)';

export const REQUETE_SURVOL = '(hover: hover)';

const ecranRepondA = (requete: string): boolean =>
  typeof matchMedia === 'function' && matchMedia(requete).matches;

export function prefereMouvementReduit(): boolean {
  return ecranRepondA(REQUETE_MOUVEMENT_REDUIT);
}

export function ecranASurvol(): boolean {
  return ecranRepondA(REQUETE_SURVOL);
}
