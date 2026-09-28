export const COURS_BTS: readonly string[] = [
  'b2-01-traitement-information-chiffree',
  'b2-02-series-statistiques',
];

export function cheminDuCoursBts(slug: string): string {
  return `formations/${slug}`;
}

export function cleSeoDuCoursBts(slug: string): string {
  return `formations-${slug}`;
}
