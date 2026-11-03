export const REQUETE_MOUVEMENT_REDUIT = '(prefers-reduced-motion: reduce)';

export function prefereMouvementReduit(): boolean {
  return typeof matchMedia === 'function' && matchMedia(REQUETE_MOUVEMENT_REDUIT).matches;
}
