import { estAliasDAccueil, normalizePath } from './chemins';
import type { SeoMetadataFile, SeoPageEntry } from './seo-metadata.model';

const ID_DE_L_ACCUEIL = 'home';

export const estPageDAccueil = (page: SeoPageEntry): boolean => page.id === ID_DE_L_ACCUEIL;

export const cheminPublicDeLaPage = (page: SeoPageEntry): string =>
  estPageDAccueil(page) ? '/' : page.path;

export const pageSeoDeLaRoute = (
  metadata: SeoMetadataFile,
  route: string,
): SeoPageEntry | undefined =>
  metadata.pages.find((page) =>
    estAliasDAccueil(normalizePath(route))
      ? estPageDAccueil(page)
      : normalizePath(page.path) === normalizePath(route),
  );
