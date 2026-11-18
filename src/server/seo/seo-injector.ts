import type { SeoMetadataFile } from '../../app/core/seo/seo-metadata.model';
import { LOCALES_DU_SITE } from '../../app/core/config/locales';
import { routeSansLocale } from '../../app/core/seo/chemins';
import { NOM_DU_SITE } from '../../app/core/seo/nom-du-site';
import { localeParDefaut } from '../../app/core/seo/pages-seo';

const ARTICLE_FEED_PATH = '/api/v1/portfolio25/articles/feed.xml';
const ARTICLE_FEED_TITLES: Record<string, string> = {
  fr: `Veille IA — ${NOM_DU_SITE}`,
  en: `AI Watch — ${NOM_DU_SITE}`,
};

const buildArticleFeedLink = (
  metadata: SeoMetadataFile,
  originalUrl: string,
  baseUrl: string,
): string => {
  const defaultLocale = localeParDefaut(metadata);
  const prefixed = routeSansLocale(originalUrl, LOCALES_DU_SITE).locale ?? defaultLocale;
  const locale = prefixed in ARTICLE_FEED_TITLES ? prefixed : defaultLocale;
  const href = new URL(ARTICLE_FEED_PATH, baseUrl);
  href.searchParams.set('locale', locale);
  return `<link rel="alternate" type="application/rss+xml" title="${ARTICLE_FEED_TITLES[locale] ?? ARTICLE_FEED_TITLES['fr']}" href="${href.toString()}" />`;
};

export const injectSeoHead = (
  html: string,
  metadata: SeoMetadataFile,
  originalUrl: string,
  baseUrl: string,
): string =>
  html
    .replace(/<link\s+rel="alternate"\s+type="application\/rss\+xml"[^>]*>\s*/gi, '')
    .replace('</head>', `${buildArticleFeedLink(metadata, originalUrl, baseUrl)}\n</head>`);
