import type { SeoMetadataFile } from '../../app/core/seo/seo-metadata.model';

type PageSeo = SeoMetadataFile['pages'][number];

export const SLUG_DU_COURS_B2 = 'b2-01-traitement-information-chiffree';

export const CHEMIN_DU_COURS_B2 = `/formations/${SLUG_DU_COURS_B2}`;

function buildPageSeo(overrides: Partial<PageSeo> = {}): PageSeo {
  return {
    id: 'page',
    path: '/page',
    index: true,
    locales: { fr: { title: 'Page', description: 'x' } },
    ...overrides,
  } as PageSeo;
}

export function buildPageDuCoursB2(lastmod?: string): PageSeo {
  return buildPageSeo({
    id: `formations-${SLUG_DU_COURS_B2}`,
    path: CHEMIN_DU_COURS_B2,
    lastmod,
    locales: { fr: { title: 'B2', description: 'x' } },
  } as Partial<PageSeo>);
}

export function buildSeoMetadata(
  pages: readonly PageSeo[],
  overrides: Partial<SeoMetadataFile> = {},
): SeoMetadataFile {
  return {
    site: {
      baseUrl: 'https://asilidesign.fr',
      defaultLocale: 'fr',
      locales: ['fr', 'en'],
      homePath: '/',
    },
    pages,
    ...overrides,
  } as SeoMetadataFile;
}
