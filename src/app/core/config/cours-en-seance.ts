export const COURS_EN_SEANCE: readonly string[] = [
  'b2-01-traitement-information-chiffree',
  'b2-02-series-statistiques',
  'b2-03-logique',
  'b2-04-suites',
  'b2-05-mathematiques-financieres',
  'b2-06-exponentielle-logarithme',
  'b3-01-donnee-brute-decision',
];

export function cheminDuCoursEnSeance(slug: string): string {
  return `formations/${slug}`;
}

export function cleSeoDuCoursEnSeance(slug: string): string {
  return `formations-${slug}`;
}
