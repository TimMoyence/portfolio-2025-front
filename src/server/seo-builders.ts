import type {
  SeoLocaleMeta,
  SeoMetadataFile,
  SeoPageEntry,
} from '../app/core/seo/seo-metadata.model';
import type { PublicationDeCours } from './cours-publication';
import { buildLocalizedPath, normalizePath, urlLocalisee } from '../app/core/seo/chemins';
import {
  cheminPublicDeLaPage,
  estIndexable,
  estPageDAccueil,
  localeParDefaut,
  pagesIndexables,
} from '../app/core/seo/pages-seo';
import { escapeHtml } from '../cours/runtime/core/html';

const AI_USER_AGENTS: ReadonlyArray<string> = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
];

type SitemapContext = {
  activeLocales: string[];
  defaultLocale: string;
  baseUrl: string;
};

export interface DynamicArticleSitemapEntry {
  locale: string;
  slug: string;
  lastmod?: string;
}

const alternateLink = (hreflang: string, href: string): string =>
  `    <xhtml:link rel="alternate" hreflang="${escapeHtml(hreflang)}" href="${escapeHtml(href)}" />`;

const alternatesMarkupOf = (pagePath: string, ctx: SitemapContext): string => {
  const { activeLocales, defaultLocale, baseUrl } = ctx;
  const links = activeLocales.map((locale) =>
    alternateLink(locale || defaultLocale, urlLocalisee(baseUrl, locale, pagePath)),
  );
  if (defaultLocale) {
    links.push(alternateLink('x-default', urlLocalisee(baseUrl, defaultLocale, pagePath)));
  }
  return links.length ? `\n${links.join('\n')}\n` : '';
};

const metaPrincipale = (page: SeoPageEntry, locale: string): SeoLocaleMeta | undefined =>
  page.locales?.[locale] ?? Object.values(page.locales ?? {})[0];

const indentedTag = (name: string, value: string | undefined): string =>
  value ? `    <${name}>${value}</${name}>` : '';

const priorityValueOf = (page: SeoPageEntry): string | undefined =>
  typeof page.priority === 'number' ? page.priority.toFixed(1) : undefined;

const jourDePublication = (publieLe: string): string | undefined => {
  const instant = Date.parse(publieLe);
  return Number.isNaN(instant) ? undefined : new Date(instant).toISOString().slice(0, 10);
};

const jourDeLastmod = (lastmod: string | undefined): string | undefined =>
  lastmod === undefined ? undefined : jourDePublication(lastmod);

const lastmodOf = (
  page: SeoPageEntry,
  publications: readonly PublicationDeCours[],
): string | undefined => {
  const publication = publications.find(({ chemin }) => chemin === page.path);
  const publieLe = publication === undefined ? undefined : jourDePublication(publication.publieLe);
  if (publieLe === undefined || page.lastmod === undefined) {
    return publieLe ?? page.lastmod;
  }
  return publieLe > page.lastmod ? publieLe : page.lastmod;
};

const urlEntryOf = (
  page: SeoPageEntry,
  loc: string,
  alternatesMarkup: string,
  lastmod: string | undefined,
): string =>
  [
    '  <url>',
    `    <loc>${escapeHtml(loc)}</loc>`,
    alternatesMarkup ? alternatesMarkup.trimEnd() : '',
    indentedTag('lastmod', lastmod),
    indentedTag('changefreq', page.changefreq),
    indentedTag('priority', priorityValueOf(page)),
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');

const dynamicArticleEntryOf = (article: DynamicArticleSitemapEntry, baseUrl: string): string =>
  [
    '  <url>',
    `    <loc>${escapeHtml(urlLocalisee(baseUrl, article.locale, '/articles/' + article.slug))}</loc>`,
    indentedTag('lastmod', jourDeLastmod(article.lastmod)),
    '    <changefreq>daily</changefreq>',
    '    <priority>0.6</priority>',
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');

export const buildSitemapXml = (
  metadata: SeoMetadataFile,
  baseUrl: string,
  dynamicArticles: readonly DynamicArticleSitemapEntry[] = [],
  publicationsDeCours: readonly PublicationDeCours[] = [],
): string => {
  const locales = metadata.site.locales ?? [];
  const activeLocales = locales.length > 0 ? locales : [''];
  const ctx: SitemapContext = {
    activeLocales,
    defaultLocale: localeParDefaut(metadata),
    baseUrl,
  };

  const urlEntries = pagesIndexables(metadata).flatMap((page) => {
    const pagePath = cheminPublicDeLaPage(page);
    const alternatesMarkup = alternatesMarkupOf(pagePath, ctx);
    const lastmod = lastmodOf(page, publicationsDeCours);
    return activeLocales.map((locale) =>
      urlEntryOf(page, urlLocalisee(baseUrl, locale, pagePath), alternatesMarkup, lastmod),
    );
  });

  const dynamicEntries = dynamicArticles
    .filter(
      (article) =>
        activeLocales.includes(article.locale) &&
        /^[a-z0-9]+(?:-[a-z0-9]+){2,100}$/.test(article.slug),
    )
    .map((article) => dynamicArticleEntryOf(article, baseUrl));

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    [...urlEntries, ...dynamicEntries].join('\n'),
    `</urlset>`,
    '',
  ].join('\n');
};

/** Format defini par le standard https://llmstxt.org/. */
export const buildLlmsTxt = (metadata: SeoMetadataFile, baseUrl: string): string => {
  const defaultLocale = localeParDefaut(metadata);
  const indexablePages = pagesIndexables(metadata);

  const resolveLocaleMeta = (
    page: (typeof metadata.pages)[number],
  ): { title: string; description: string } => {
    const meta = metaPrincipale(page, defaultLocale);
    return {
      title: meta?.title ?? page.id,
      description: meta?.description ?? '',
    };
  };

  const buildLink = (page: (typeof metadata.pages)[number]): string => {
    const href = urlLocalisee(baseUrl, defaultLocale, cheminPublicDeLaPage(page));
    const { title, description } = resolveLocaleMeta(page);
    const desc = description ? `: ${description}` : '';
    return `- [${title}](${href})${desc}`;
  };

  const site = metadata.global?.localBusiness as
    { name?: string; description?: string; founder?: { name?: string } } | undefined;
  const siteName = site?.name ?? 'Asili Design';
  const siteDescription = site?.description ?? '';
  const founderName = site?.founder?.name ?? 'Tim Moyence';

  const servicePages = indexablePages.filter(
    (p) =>
      ['offer', 'growth-audit'].includes(p.id) ||
      p.id === 'formations' ||
      p.id.startsWith('formations-'),
  );
  const aboutPages = indexablePages.filter((p) => ['presentation', 'projets'].includes(p.id));
  const contactPages = indexablePages.filter((p) => p.id === 'contact');
  const legalPages = indexablePages.filter((p) =>
    ['terms', 'privacy', 'cookie-settings'].includes(p.id),
  );

  const section = (title: string, pages: typeof indexablePages): string[] => {
    if (pages.length === 0) return [];
    return [`## ${title}`, '', ...pages.map(buildLink), ''];
  };

  const homeMeta = indexablePages.find(estPageDAccueil);
  const homeTagline = homeMeta ? resolveLocaleMeta(homeMeta).description : '';
  const heading = founderName ? `${siteName} — ${founderName}` : siteName;
  const tagline = homeTagline || siteDescription;

  const lines: string[] = [
    `# ${heading}`,
    '',
    tagline ? `> ${tagline}` : '',
    '',
    ...section('Services', servicePages),
    ...section('A propos', aboutPages),
    ...section('Contact', contactPages),
    ...section('Legal', legalPages),
  ];

  return lines.join('\n') + '\n';
};

export const buildRobotsTxt = (metadata: SeoMetadataFile, baseUrl: string): string => {
  const locales = metadata.site.locales ?? [];
  const disallowPaths = new Set<string>();

  for (const page of metadata.pages) {
    if (estIndexable(page)) continue;

    if (page.path.includes(':')) continue;

    // Une page bloquee par robots.txt ne voit jamais son `noindex` lu par Google :
    // https://developers.google.com/search/docs/crawling-indexing/block-indexing
    if (page.id === 'cookie-settings') continue;

    disallowPaths.add(normalizePath(page.path));
    for (const locale of locales) {
      disallowPaths.add(buildLocalizedPath(locale, page.path));
    }
  }

  const buildAgentBlock = (agent: string): string[] => {
    const block = [`User-agent: ${agent}`];
    if (disallowPaths.size === 0) {
      block.push('Allow: /');
    } else {
      for (const path of disallowPaths) {
        block.push(`Disallow: ${path}`);
      }
      block.push('Allow: /');
    }
    return block;
  };

  const lines: string[] = [];
  lines.push(...buildAgentBlock('*'));
  for (const agent of AI_USER_AGENTS) {
    lines.push('');
    lines.push(...buildAgentBlock(agent));
  }

  const sitemapUrl = new URL('/sitemap.xml', baseUrl).toString();
  lines.push('');
  lines.push(`Sitemap: ${sitemapUrl}`);
  return `${lines.join('\n')}\n`;
};

export const buildLlmsFullTxt = (metadata: SeoMetadataFile, baseUrl: string): string => {
  const defaultLocale = localeParDefaut(metadata);
  const indexablePages = pagesIndexables(metadata);

  const lines: string[] = [];
  const site = metadata.global?.localBusiness as
    { name?: string; description?: string } | undefined;
  lines.push(`# ${site?.name ?? 'Asili Design'} — llms-full`);
  lines.push('');
  lines.push('> Agregation complete du contenu indexable (title, description, URL,');
  lines.push('> dateModified, mots-cles) pour ingestion par moteurs IA generatifs.');
  lines.push('> Format non-standard — extension proposee au standard llmstxt.org.');
  lines.push('');

  for (const page of indexablePages) {
    const meta = metaPrincipale(page, defaultLocale);
    if (!meta) continue;
    const href = urlLocalisee(baseUrl, defaultLocale, cheminPublicDeLaPage(page));

    lines.push(`## ${meta.title}`);
    lines.push('');
    lines.push(`- URL: ${href}`);
    if (page.lastmod) lines.push(`- Last modified: ${page.lastmod}`);
    if (meta.keywords && meta.keywords.length > 0) {
      lines.push(`- Keywords: ${meta.keywords.slice(0, 10).join(', ')}`);
    }
    lines.push('');
    lines.push(meta.description);
    lines.push('');
  }

  return lines.join('\n') + '\n';
};
