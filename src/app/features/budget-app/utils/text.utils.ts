/**
 * Normalise un texte en minuscules sans diacritiques.
 * Utile pour les comparaisons insensibles aux accents et a la casse.
 *
 * @param value - La chaine a normaliser.
 * @returns La chaine en minuscules, sans accents ni diacritiques.
 */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
