import type { SeoLocaleMeta, SeoMetadataFile } from '../../app/core/seo/seo-metadata.model';

export type PageSeo = SeoMetadataFile['pages'][number];

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

export function buildPageSeoFr(
  id: string,
  path: string,
  fr: Partial<SeoLocaleMeta> = {},
  overrides: Partial<PageSeo> = {},
): PageSeo {
  return buildPageSeo({
    id,
    path,
    locales: { fr: { title: 'x', description: 'x', ...fr } },
    ...overrides,
  });
}

export function buildPageDuCoursB2(lastmod?: string): PageSeo {
  return buildPageSeoFr(
    `formations-${SLUG_DU_COURS_B2}`,
    CHEMIN_DU_COURS_B2,
    { title: 'B2' },
    { lastmod },
  );
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
