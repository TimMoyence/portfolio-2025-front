import COURS_SERVIS from '../../../../contrat/cours-servis.gen.json';

export const COURS_EN_SEANCE: readonly string[] = COURS_SERVIS.map(({ slug }) => slug);

const DUREES_SERVIES = new Map(COURS_SERVIS.map(({ slug, duree }) => [slug, duree]));
const PAS_DE_L_ARRONDI = 5;

export function dureeDuCoursEnSeance(slug: string): string {
  const servie = DUREES_SERVIES.get(slug);
  if (servie === undefined) {
    throw new Error(`${slug} : cours absent de la séance`);
  }
  const arrondie = Math.round(servie / PAS_DE_L_ARRONDI) * PAS_DE_L_ARRONDI;
  const heures = Math.floor(arrondie / 60);
  const minutes = String(arrondie % 60).padStart(2, '0');
  return $localize`:@@cours-en-seance.duree:${heures}:heures: h ${minutes}:minutes:`;
}

export function cheminDuCoursEnSeance(slug: string): string {
  return `formations/${slug}`;
}

export function cheminDuPupitre(slug: string): string {
  return `/cours/presenter/${encodeURIComponent(slug)}`;
}

export function cleSeoDuCoursEnSeance(slug: string): string {
  return `formations-${slug}`;
}
