export function echelle(
  depart: number,
  etendue: number,
  origine: number,
  longueur: number,
): (valeur: number) => number {
  const diviseur = etendue || 1;
  return (valeur) => origine + ((valeur - depart) / diviseur) * longueur;
}

export function jalons(depart: number, arrivee: number, intervalles: number): number[] {
  return Array.from(
    { length: intervalles + 1 },
    (_, rang) => depart + ((arrivee - depart) * rang) / intervalles,
  );
}
