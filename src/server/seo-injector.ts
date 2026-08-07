import type { SeoMetadataFile } from '../app/core/seo/seo-metadata.model';
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
    enriched['author'] = { '@id': 'https://asilidesign.fr/#person' };
  }

  return enriched;
};

const buildJsonLdScripts = (metadata: SeoMetadataFile, originalUrl: string): string => {
  const localeMatch = originalUrl.match(LOCALE_PREFIX_RE);
  const locale = localeMatch ? localeMatch[1] : metadata.site.defaultLocale;
  const routePath = originalUrl.replace(STRIP_LOCALE_RE, '').split('?')[0].split('#')[0];
  const normalizedRoute = routePath ? `/${routePath}` : '/';

  const scripts: string[] = [];

  const addScript = (data: Record<string, unknown>): void => {
    // Neutralise TOUS les `<`, pas seulement `</script>` : le parseur HTML a un
    // etat « script data double escaped » ou un `<!--` suivi d'un `<script`
    // empeche le `</script>` suivant de fermer le bloc (mXSS). `<` est un
    // echappement JSON standard, le JSON-LD reste parsable a l'identique.
    const json = JSON.stringify(data).replace(/</g, '\\u003c');
    scripts.push(`<script type="application/ld+json">${json}</script>`);
  };

  if (metadata.global?.localBusiness) {
    addScript(metadata.global.localBusiness);
  }
  if (metadata.global?.siteNavigation) {
    addScript(metadata.global.siteNavigation);
  }
  const isPresentationRoute = normalizedRoute === '/presentation';
  if (metadata.global?.person && !isPresentationRoute) {
    addScript(metadata.global.person);
  }

  const page = metadata.pages.find(
    (p) =>
      normalizePath(p.path) === normalizePath(normalizedRoute) ||
      (normalizedRoute === '/' && p.id === 'home'),
  );

  if (page) {
    const localeMeta = page.locales[locale] ?? page.locales[metadata.site.defaultLocale];
    if (localeMeta?.jsonLd) {
      const blocks: Record<string, unknown>[] = Array.isArray(localeMeta.jsonLd)
        ? localeMeta.jsonLd
        : [localeMeta.jsonLd];
      for (const block of blocks) {
        addScript(enrichJsonLdBlock(block, page));
      }
    }

    if (page.breadcrumb && page.breadcrumb.length > 0) {
      const baseUrl = metadata.site.baseUrl ?? 'https://asilidesign.fr';
      addScript({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: page.breadcrumb.map((entry, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: entry.name,
          item: `${baseUrl}/${locale}${entry.path === '/' ? '' : entry.path}`,
        })),
      });
    }
  }

  return scripts.join('\n');
};

const buildSeoLinkTags = (
  metadata: SeoMetadataFile,
  originalUrl: string,
  baseUrl: string,
): string => {
  const locales = metadata.site.locales ?? [];
  const defaultLocale = metadata.site.defaultLocale ?? locales[0] ?? 'fr';

  const routePath = originalUrl.replace(STRIP_LOCALE_RE, '').split('?')[0].split('#')[0];
  const normalizedRoute = routePath ? `/${routePath}` : '/';

  const page = metadata.pages.find(
    (p) =>
      normalizePath(p.path) === normalizePath(normalizedRoute) ||
      (normalizedRoute === '/' && p.id === 'home'),
  );

  if (!page || page.index === false) return '';

  const pagePath = page.id === 'home' ? '/' : page.path;
  const currentLocale = originalUrl.match(LOCALE_PREFIX_RE)?.[1] ?? defaultLocale;
  const tags: string[] = [];

  const canonicalHref = new URL(buildLocalizedPath(currentLocale, pagePath), baseUrl).toString();
  tags.push(`<link rel="canonical" href="${canonicalHref}" />`);

  for (const locale of locales) {
    const href = new URL(buildLocalizedPath(locale, pagePath), baseUrl).toString();
    tags.push(`<link rel="alternate" hreflang="${locale}" href="${href}" />`);
  }

  const defaultHref = new URL(buildLocalizedPath(defaultLocale, pagePath), baseUrl).toString();
  tags.push(`<link rel="alternate" hreflang="x-default" href="${defaultHref}" />`);

  return tags.join('\n');
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
