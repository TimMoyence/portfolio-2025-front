import type { SeoPageEntry } from './seo-metadata.model';

const SEPARATEUR_DU_TITRE = ' — ';

const teteDuTitre = (titre: string): string => titre.split(SEPARATEUR_DU_TITRE)[0].trim();

export const nomCourt = (page: SeoPageEntry, langue: string): string => {
  const locales = Object.entries(page.locales);
  const sansNom = locales.find(([, meta]) => meta.nom === undefined);
  if (sansNom && locales.some(([, meta]) => meta.nom !== undefined)) {
    throw new Error(`nom sans traduction : ${page.id} (${sansNom[0]})`);
  }
  const recopie = locales.find(([, meta]) => meta.nom === teteDuTitre(meta.title));
  if (recopie) throw new Error(`nom recopie la tête du titre : ${page.id} (${recopie[0]})`);
  const meta = page.locales[langue] ?? locales[0][1];
  return meta.nom ?? teteDuTitre(meta.title);
};
