import type { SeoMetadataFile, SeoPageEntry } from '../app/core/seo/seo-metadata.model';
import { buildLocalizedPath, normalizePath } from './url-utils';

const AI_USER_AGENTS: ReadonlyArray<string> = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
];

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

type SitemapContext = {
  activeLocales: string[];
  defaultLocale: string;
  baseUrl: string;
};

const localizedHref = (locale: string, pagePath: string, baseUrl: string): string =>
  new URL(buildLocalizedPath(locale, pagePath), baseUrl).toString();

const alternateLink = (hreflang: string, href: string): string =>
  `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`;

const alternatesMarkupOf = (pagePath: string, ctx: SitemapContext): string => {
  const { activeLocales, defaultLocale, baseUrl } = ctx;
  const links = activeLocales.map((locale) =>
    alternateLink(locale || defaultLocale, localizedHref(locale, pagePath, baseUrl)),
  );
  if (defaultLocale) {
    links.push(alternateLink('x-default', localizedHref(defaultLocale, pagePath, baseUrl)));
  }
  return links.length ? `\n${links.join('\n')}\n` : '';
};

const indentedTag = (name: string, value: string | undefined): string =>
  value ? `    <${name}>${value}</${name}>` : '';

const priorityValueOf = (page: SeoPageEntry): string | undefined =>
  typeof page.priority === 'number' ? page.priority.toFixed(1) : undefined;

const urlEntryOf = (page: SeoPageEntry, loc: string, alternatesMarkup: string): string =>
  [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    alternatesMarkup ? alternatesMarkup.trimEnd() : '',
    indentedTag('lastmod', page.lastmod),
    indentedTag('changefreq', page.changefreq),
    indentedTag('priority', priorityValueOf(page)),
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');

export const buildSitemapXml = (metadata: SeoMetadataFile, baseUrl: string): string => {
  const locales = metadata.site.locales ?? [];
  const activeLocales = locales.length > 0 ? locales : [''];
  const ctx: SitemapContext = {
    activeLocales,
    defaultLocale: metadata.site.defaultLocale ?? activeLocales[0],
    baseUrl,
  };

  const urlEntries = metadata.pages
    .filter((page) => page.index !== false)
    .flatMap((page) => {
      const pagePath = page.id === 'home' ? '/' : page.path;
      const alternatesMarkup = alternatesMarkupOf(pagePath, ctx);
      return activeLocales.map((locale) =>
        urlEntryOf(page, localizedHref(locale, pagePath, baseUrl), alternatesMarkup),
      );
    });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    urlEntries.join('\n'),
    `</urlset>`,
    '',
  ].join('\n');
};

/** Format defini par le standard https://llmstxt.org/. */
export const buildLlmsTxt = (metadata: SeoMetadataFile, baseUrl: string): string => {
  const defaultLocale = metadata.site.defaultLocale ?? 'fr';
  const indexablePages = metadata.pages.filter((page) => page.index !== false);

  const resolveLocaleMeta = (
    page: (typeof metadata.pages)[number],
  ): { title: string; description: string } => {
    const meta = page.locales?.[defaultLocale] ?? Object.values(page.locales ?? {})[0];
    return {
      title: meta?.title ?? page.id,
      description: meta?.description ?? '',
    };
  };

  const buildLink = (page: (typeof metadata.pages)[number]): string => {
    const path = page.id === 'home' ? '/' : page.path;
    const href = new URL(buildLocalizedPath(defaultLocale, path), baseUrl).toString();
    const { title, description } = resolveLocaleMeta(page);
    const desc = description ? `: ${description}` : '';
    return `- [${title}](${href})${desc}`;
  };

  const site = metadata.global?.localBusiness as
    | { name?: string; description?: string; founder?: { name?: string } }
    | undefined;
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
  const appPages = indexablePages.filter((p) => ['weather', 'sebastian'].includes(p.id));
  const contactPages = indexablePages.filter((p) => p.id === 'contact');
  const legalPages = indexablePages.filter((p) =>
    ['terms', 'privacy', 'cookie-settings'].includes(p.id),
  );

  const section = (title: string, pages: typeof indexablePages): string[] => {
    if (pages.length === 0) return [];
    return [`## ${title}`, '', ...pages.map(buildLink), ''];
  };

  const homeMeta = indexablePages.find((p) => p.id === 'home');
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
    ...section('Applications metier', appPages),
    ...section('Contact', contactPages),
    ...section('Legal', legalPages),
  ];

  return lines.join('\n') + '\n';
};

export const buildRobotsTxt = (metadata: SeoMetadataFile, baseUrl: string): string => {
  const locales = metadata.site.locales ?? [];
  const disallowPaths = new Set<string>();

  for (const page of metadata.pages) {
    if (page.index !== false) continue;

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
  const defaultLocale = metadata.site.defaultLocale ?? 'fr';
  const indexablePages = metadata.pages.filter((page) => page.index !== false);

  const lines: string[] = [];
  const site = metadata.global?.localBusiness as
    | { name?: string; description?: string }
    | undefined;
  lines.push(`# ${site?.name ?? 'Asili Design'} — llms-full`);
  lines.push('');
  lines.push('> Agregation complete du contenu indexable (title, description, URL,');
  lines.push('> dateModified, mots-cles) pour ingestion par moteurs IA generatifs.');
  lines.push('> Format non-standard — extension proposee au standard llmstxt.org.');
  lines.push('');

  for (const page of indexablePages) {
    const meta = page.locales[defaultLocale] ?? Object.values(page.locales ?? {})[0];
    if (!meta) continue;
    const path = page.id === 'home' ? '/' : page.path;
    const href = new URL(buildLocalizedPath(defaultLocale, path), baseUrl).toString();

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
