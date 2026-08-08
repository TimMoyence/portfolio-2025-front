import type { SeoMetadataFile, SeoPageEntry } from '../app/core/seo/seo-metadata.model';
import { LOCALE_PREFIX_RE, STRIP_LOCALE_RE, buildLocalizedPath, normalizePath } from './url-utils';

const FRESHNESS_ENABLED_TYPES = new Set([
  'WebPage',
  'ProfilePage',
  'AboutPage',
  'ContactPage',
  'Article',
  'BlogPosting',
  'NewsArticle',
  'CreativeWork',
  'Course',
  'Service',
  'ProfessionalService',
  'ItemList',
  'FAQPage',
  'WebSite',
]);

const DEFAULT_BASE_URL = 'https://asilidesign.fr';

const enrichJsonLdBlock = (
  block: Record<string, unknown>,
  page: { lastmod?: string },
): Record<string, unknown> => {
  const type = block['@type'];
  const typeStr = typeof type === 'string' ? type : null;
  if (!typeStr || !FRESHNESS_ENABLED_TYPES.has(typeStr)) return block;

  const enriched: Record<string, unknown> = { ...block };

  if (!enriched['dateModified'] && page.lastmod) {
    enriched['dateModified'] = page.lastmod;
  }
  if (!enriched['datePublished'] && enriched['dateModified']) {
    enriched['datePublished'] = enriched['dateModified'];
  }
  if (
    !enriched['author'] &&
    typeStr !== 'WebSite' &&
    typeStr !== 'LocalBusiness' &&
    typeStr !== 'ProfessionalService'
  ) {
    enriched['author'] = { '@id': `${DEFAULT_BASE_URL}/#person` };
  }

  return enriched;
};

const routeOf = (originalUrl: string): string => {
  const routePath = originalUrl.replace(STRIP_LOCALE_RE, '').split('?')[0].split('#')[0];
  return routePath ? `/${routePath}` : '/';
};

const findPage = (metadata: SeoMetadataFile, route: string): SeoPageEntry | undefined =>
  metadata.pages.find(
    (p) => normalizePath(p.path) === normalizePath(route) || (route === '/' && p.id === 'home'),
  );

const toJsonLdScript = (data: Record<string, unknown>): string => {
  // Tous les `<` sont echappes, pas seulement `</script>` : apres un `<!--<script`,
  // l'etat « script data double escaped » du tokenizer HTML empeche le `</script>`
  // suivant de fermer le bloc (mXSS).
  // https://html.spec.whatwg.org/multipage/parsing.html#script-data-double-escaped-state
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
};

const globalBlocks = (metadata: SeoMetadataFile, route: string): Record<string, unknown>[] => {
  const global = metadata.global;
  if (!global) return [];
  const blocks: Record<string, unknown>[] = [];
  if (global.localBusiness) blocks.push(global.localBusiness);
  if (global.siteNavigation) blocks.push(global.siteNavigation);
  if (global.person && route !== '/presentation') blocks.push(global.person);
  return blocks;
};

const pageBlocks = (
  page: SeoPageEntry,
  locale: string,
  defaultLocale: string,
): Record<string, unknown>[] => {
  const localeMeta = page.locales[locale] ?? page.locales[defaultLocale];
  if (!localeMeta?.jsonLd) return [];
  return Array.isArray(localeMeta.jsonLd) ? localeMeta.jsonLd : [localeMeta.jsonLd];
};

const breadcrumbBlocks = (
  page: SeoPageEntry,
  metadata: SeoMetadataFile,
  locale: string,
): Record<string, unknown>[] => {
  const breadcrumb = page.breadcrumb;
  if (!breadcrumb || breadcrumb.length === 0) return [];
  const baseUrl = metadata.site.baseUrl ?? DEFAULT_BASE_URL;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumb.map((entry, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: entry.name,
        item: `${baseUrl}/${locale}${entry.path === '/' ? '' : entry.path}`,
      })),
    },
  ];
};

const buildJsonLdScripts = (metadata: SeoMetadataFile, originalUrl: string): string => {
  const locale = LOCALE_PREFIX_RE.exec(originalUrl)?.[1] ?? metadata.site.defaultLocale;
  const route = routeOf(originalUrl);
  const page = findPage(metadata, route);

  const blocks = [...globalBlocks(metadata, route)];
  if (page) {
    for (const block of pageBlocks(page, locale, metadata.site.defaultLocale)) {
      blocks.push(enrichJsonLdBlock(block, page));
    }
    blocks.push(...breadcrumbBlocks(page, metadata, locale));
  }

  return blocks.map(toJsonLdScript).join('\n');
};

const buildSeoLinkTags = (
  metadata: SeoMetadataFile,
  originalUrl: string,
  baseUrl: string,
): string => {
  const locales = metadata.site.locales ?? [];
  const defaultLocale = metadata.site.defaultLocale ?? locales[0] ?? 'fr';

  const page = findPage(metadata, routeOf(originalUrl));
  if (!page || page.index === false) return '';

  const pagePath = page.id === 'home' ? '/' : page.path;
  const currentLocale = LOCALE_PREFIX_RE.exec(originalUrl)?.[1] ?? defaultLocale;
  const hrefFor = (locale: string): string =>
    new URL(buildLocalizedPath(locale, pagePath), baseUrl).toString();

  return [
    `<link rel="canonical" href="${hrefFor(currentLocale)}" />`,
    ...locales.map(
      (locale) => `<link rel="alternate" hreflang="${locale}" href="${hrefFor(locale)}" />`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${hrefFor(defaultLocale)}" />`,
  ].join('\n');
};

export const isKnownRoute = (routePath: string, metadata: SeoMetadataFile): boolean => {
  const normalized = routePath === '' ? '/' : routePath;
  return metadata.pages.some((page) => page.path === normalized);
};

export const injectSeoHead = (
  html: string,
  metadata: SeoMetadataFile,
  originalUrl: string,
  baseUrl: string,
): string => {
  const links = buildSeoLinkTags(metadata, originalUrl, baseUrl);
  const scripts = buildJsonLdScripts(metadata, originalUrl);
  const combined = [links, scripts].filter((value) => value).join('\n');
  if (!combined) return html;

  let cleaned = html;
  cleaned = cleaned.replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '');
  cleaned = cleaned.replace(/<link\s+rel="alternate"\s+hreflang="[^"]*"[^>]*>\s*/gi, '');
  return cleaned.replace('</head>', `${combined}\n</head>`);
};
