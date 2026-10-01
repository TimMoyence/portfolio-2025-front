export const COURS_BTS: readonly string[] = [
  'b2-01-traitement-information-chiffree',
  'b2-02-series-statistiques',
  'b2-03-logique',
  'b2-04-suites',
  'b2-05-mathematiques-financieres',
  'b2-06-exponentielle-logarithme',
];

export function cheminDuCoursBts(slug: string): string {
  return `formations/${slug}`;
}

export function cleSeoDuCoursBts(slug: string): string {
  return `formations-${slug}`;
}
