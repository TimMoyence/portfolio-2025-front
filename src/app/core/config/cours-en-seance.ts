import COURS_SERVIS from '../../../../contrat/cours-servis.gen.json';

export const COURS_EN_SEANCE: readonly string[] = COURS_SERVIS;

export function cheminDuCoursEnSeance(slug: string): string {
  return `formations/${slug}`;
}

export function cheminDuPupitre(slug: string): string {
  return `/cours/presenter/${encodeURIComponent(slug)}`;
}

export function cleSeoDuCoursEnSeance(slug: string): string {
  return `formations-${slug}`;
}
