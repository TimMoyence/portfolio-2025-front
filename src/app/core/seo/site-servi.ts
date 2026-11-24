import seoMetadata from '../../../assets/seo/seo-metadata.json';
import { langueDuSite } from '../config/locales';
import { nomCourt } from './noms-courts';
import { localeParDefaut } from './pages/pages-seo';
import type { SeoMetadataFile, SeoPageEntry } from './seo-metadata.model';

export const METADONNEES_DU_SITE = seoMetadata as unknown as SeoMetadataFile;

export const LANGUE_SERVIE = langueDuSite($localize.locale ?? localeParDefaut(METADONNEES_DU_SITE));

const pageDuChemin = (chemin: string): SeoPageEntry => {
  const page = METADONNEES_DU_SITE.pages.find(({ path }) => path === chemin);
  if (page === undefined) throw new Error(`aucune page SEO à ${chemin}`);
  return page;
};

export const nomCourtServi = (chemin: string): string =>
  nomCourt(pageDuChemin(chemin), LANGUE_SERVIE);

export const descriptionServie = (chemin: string): string =>
  pageDuChemin(chemin).locales[LANGUE_SERVIE].description;

export const CHEMINS_DE_LA_NAVIGATION: readonly string[] =
  METADONNEES_DU_SITE.global?.navigation ?? [];

export const ENTREPRISE_DU_SITE: Record<string, unknown> =
  METADONNEES_DU_SITE.global?.localBusiness ?? {};
