import type { SeoMetadataFile } from "../app/core/seo/seo-metadata.model";
import {
  LOCALE_PREFIX_RE,
  STRIP_LOCALE_RE,
  buildLocalizedPath,
  normalizePath,
} from "./url-utils";

/**
 * Types de schema Schema.org dans lesquels il est pertinent d'injecter
 * automatiquement un `dateModified` a partir de `page.lastmod`.
 * Les types comme BreadcrumbList ou SiteNavigationElement ne portent
 * pas naturellement cette notion.
 */
const FRESHNESS_ENABLED_TYPES = new Set([
  "WebPage",
  "ProfilePage",
  "AboutPage",
  "ContactPage",
  "Article",
  "BlogPosting",
  "NewsArticle",
  "CreativeWork",
  "Course",
  "Service",
  "ProfessionalService",
  "ItemList",
  "FAQPage",
  "WebSite",
]);

/**
 * Enrichit un bloc JSON-LD avec des signaux de fraicheur (dateModified)
 * et d'autorite (author) quand le type le permet. Ces champs sont cruciaux
 * pour :
 * - Perplexity (favorise le contenu < 6-18 mois)
 * - ChatGPT (E-E-A-T : named authorship)
 * - Google AI Overview (freshness as ranking signal)
 */
const enrichJsonLdBlock = (
  block: Record<string, unknown>,
  page: { lastmod?: string },
): Record<string, unknown> => {
  const type = block["@type"];
  const typeStr = typeof type === "string" ? type : null;
  if (!typeStr || !FRESHNESS_ENABLED_TYPES.has(typeStr)) return block;

  const enriched: Record<string, unknown> = { ...block };

  if (!enriched["dateModified"] && page.lastmod) {
    enriched["dateModified"] = page.lastmod;
  }
  if (!enriched["datePublished"] && enriched["dateModified"]) {
    enriched["datePublished"] = enriched["dateModified"];
  }
  if (
    !enriched["author"] &&
    typeStr !== "WebSite" &&
    typeStr !== "LocalBusiness" &&
    typeStr !== "ProfessionalService"
  ) {
    enriched["author"] = { "@id": "https://asilidesign.fr/#person" };
  }

  return enriched;
};

/**
 * Construit les balises <script type="application/ld+json"> a injecter dans le HTML.
 * Inclut les schemas globaux (LocalBusiness, SiteNavigationElement) + les schemas
 * specifiques a la page + les breadcrumbs. Enrichit automatiquement les blocs
 * eligibles avec des signaux de fraicheur et d'autorite.
 */
const buildJsonLdScripts = (
  metadata: SeoMetadataFile,
  originalUrl: string,
): string => {
  const localeMatch = originalUrl.match(LOCALE_PREFIX_RE);
  const locale = localeMatch ? localeMatch[1] : metadata.site.defaultLocale;
  const routePath = originalUrl
    .replace(STRIP_LOCALE_RE, "")
    .split("?")[0]
    .split("#")[0];
  const normalizedRoute = routePath ? `/${routePath}` : "/";

  const scripts: string[] = [];

  const addScript = (data: Record<string, unknown>): void => {
    const json = JSON.stringify(data).replace(/<\/script>/gi, "<\\/script>");
    scripts.push(`<script type="application/ld+json">${json}</script>`);
  };

  if (metadata.global?.localBusiness) {
    addScript(metadata.global.localBusiness);
  }
  if (metadata.global?.siteNavigation) {
    addScript(metadata.global.siteNavigation);
  }
  const isPresentationRoute = normalizedRoute === "/presentation";
  if (metadata.global?.person && !isPresentationRoute) {
    addScript(metadata.global.person);
  }

  const page = metadata.pages.find(
    (p) =>
      normalizePath(p.path) === normalizePath(normalizedRoute) ||
      (normalizedRoute === "/" && p.id === "home"),
  );

  if (page) {
    const localeMeta =
      page.locales[locale] ?? page.locales[metadata.site.defaultLocale];
    if (localeMeta?.jsonLd) {
      const blocks: Record<string, unknown>[] = Array.isArray(localeMeta.jsonLd)
        ? localeMeta.jsonLd
        : [localeMeta.jsonLd];
      for (const block of blocks) {
        addScript(enrichJsonLdBlock(block, page));
      }
    }

    if (page.breadcrumb && page.breadcrumb.length > 0) {
      const baseUrl = metadata.site.baseUrl ?? "https://asilidesign.fr";
      addScript({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: page.breadcrumb.map((entry, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: entry.name,
          item: `${baseUrl}/${locale}${entry.path === "/" ? "" : entry.path}`,
        })),
      });
    }
  }

  return scripts.join("\n");
};

/**
 * Construit les balises `<link rel="canonical">` et `<link rel="alternate"
 * hreflang="...">` pour la page courante. Corrige le bug P1.6 ou le HTML
 * prerendu ne contenait aucun hreflang/canonical (ils etaient injectes
 * seulement apres hydratation cote client, donc invisibles pour les
 * crawlers SEO).
 *
 * Ne retourne rien si la page n'est pas indexable ou introuvable.
 */
const buildSeoLinkTags = (
  metadata: SeoMetadataFile,
  originalUrl: string,
  baseUrl: string,
): string => {
  const locales = metadata.site.locales ?? [];
  const defaultLocale = metadata.site.defaultLocale ?? locales[0] ?? "fr";

  const routePath = originalUrl
    .replace(STRIP_LOCALE_RE, "")
    .split("?")[0]
    .split("#")[0];
  const normalizedRoute = routePath ? `/${routePath}` : "/";

  const page = metadata.pages.find(
    (p) =>
      normalizePath(p.path) === normalizePath(normalizedRoute) ||
      (normalizedRoute === "/" && p.id === "home"),
  );

  if (!page || page.index === false) return "";

  const pagePath = page.id === "home" ? "/" : page.path;
  const currentLocale =
    originalUrl.match(LOCALE_PREFIX_RE)?.[1] ?? defaultLocale;
  const tags: string[] = [];

  const canonicalHref = new URL(
    buildLocalizedPath(currentLocale, pagePath),
    baseUrl,
  ).toString();
  tags.push(`<link rel="canonical" href="${canonicalHref}" />`);

  for (const locale of locales) {
    const href = new URL(
      buildLocalizedPath(locale, pagePath),
      baseUrl,
    ).toString();
    tags.push(`<link rel="alternate" hreflang="${locale}" href="${href}" />`);
  }

  const defaultHref = new URL(
    buildLocalizedPath(defaultLocale, pagePath),
    baseUrl,
  ).toString();
  tags.push(
    `<link rel="alternate" hreflang="x-default" href="${defaultHref}" />`,
  );

  return tags.join("\n");
};

/**
 * Verifie si un chemin correspond a une route connue dans les metadata SEO.
 * Utilise pour detecter les 404 cote SSR et envoyer le statut HTTP approprie
 * (evite les soft-404 qui dupent les crawlers Google en 200+contenu not-found).
 */
export const isKnownRoute = (
  routePath: string,
  metadata: SeoMetadataFile,
): boolean => {
  const normalized = routePath === "" ? "/" : routePath;
  return metadata.pages.some((page) => page.path === normalized);
};

/**
 * Injecte les balises SEO (<link canonical>, <link hreflang>, <script
 * JSON-LD>) dans le HTML avant </head>. Supprime au passage les tags
 * canonical/hreflang deja presents pour eviter les collisions quand le
 * SSR dynamique les aurait partiellement generes cote client.
 */
export const injectSeoHead = (
  html: string,
  metadata: SeoMetadataFile,
  originalUrl: string,
  baseUrl: string,
): string => {
  const links = buildSeoLinkTags(metadata, originalUrl, baseUrl);
  const scripts = buildJsonLdScripts(metadata, originalUrl);
  const combined = [links, scripts].filter((value) => value).join("\n");
  if (!combined) return html;

  let cleaned = html;
  cleaned = cleaned.replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "");
  cleaned = cleaned.replace(
    /<link\s+rel="alternate"\s+hreflang="[^"]*"[^>]*>\s*/gi,
    "",
  );
  return cleaned.replace("</head>", `${combined}\n</head>`);
};
