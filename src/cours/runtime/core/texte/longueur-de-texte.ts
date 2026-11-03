export function longueurDeTexte(texte: string): number {
  return [...texte].length;
}

export function longueurDeLaSaisie(saisie: string): number {
  return longueurDeTexte(saisie.trim());
}
