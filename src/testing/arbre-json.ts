export type Recolte = (
  cle: string,
  contenu: unknown,
  descendre: (valeur: unknown) => readonly string[],
) => readonly string[];

export function recolterDansLArbre(valeur: unknown, recolte: Recolte): readonly string[] {
  const descendre = (sous: unknown): readonly string[] => recolterDansLArbre(sous, recolte);
  if (Array.isArray(valeur)) {
    return valeur.flatMap(descendre);
  }
  if (typeof valeur !== 'object' || valeur === null) {
    return [];
  }
  return Object.entries(valeur).flatMap(([cle, contenu]) => recolte(cle, contenu, descendre));
}
