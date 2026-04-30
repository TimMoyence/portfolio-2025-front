import type { SeoMetadataFile } from "../app/core/seo/seo-metadata.model";
import { buildLocalizedPath, normalizePath } from "./url-utils";

/**
 * User-agents des moteurs IA generatifs a whitelister explicitement (P1.7).
 * L'Allow: / explicite produit un signal positif de crawlabilite pour
 * ChatGPT, Perplexity, Google AI Overview et Bing Copilot. Les pages non
 * indexables (`index:false`) restent disallowed globalement via le bloc
 * `User-agent: *` en amont.
 */
const AI_USER_AGENTS: ReadonlyArray<string> = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
];

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/**
 * Construit un sitemap.xml standard Google : pour chaque page indexable,
 * emet un <url> avec <loc>, alternates hreflang (+ x-default) et les
 * attributs optionnels lastmod/changefreq/priority.
 */
export const buildSitemapXml = (
  metadata: SeoMetadataFile,
  baseUrl: string,
): string => {
  const locales = metadata.site.locales ?? [];
  const activeLocales = locales.length > 0 ? locales : [""];
  const defaultLocale = metadata.site.defaultLocale ?? activeLocales[0];
  const urls = metadata.pages.filter((page) => page.index !== false);
  const urlEntries: string[] = [];

  for (const page of urls) {
    const pagePath = page.id === "home" ? "/" : page.path;
    const lastmod = page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : "";
    const changefreq = page.changefreq
      ? `<changefreq>${page.changefreq}</changefreq>`
      : "";
    const priority =
      typeof page.priority === "number"
        ? `<priority>${page.priority.toFixed(1)}</priority>`
        : "";

    const alternateLinks = activeLocales.map((locale) => {
      const path = buildLocalizedPath(locale, pagePath);
      const href = new URL(path, baseUrl).toString();
      return `    <xhtml:link rel="alternate" hreflang="${escapeXml(
        locale || defaultLocale,
      )}" href="${escapeXml(href)}" />`;
    });

    if (defaultLocale) {
      const path = buildLocalizedPath(defaultLocale, pagePath);
      const href = new URL(path, baseUrl).toString();
      alternateLinks.push(
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(
          href,
        )}" />`,
      );
    }

    const alternatesMarkup = alternateLinks.length
      ? `\n${alternateLinks.join("\n")}\n`
      : "";

    for (const locale of activeLocales) {
      const path = buildLocalizedPath(locale, pagePath);
      const loc = new URL(path, baseUrl).toString();
      urlEntries.push(
        [
          "  <url>",
          `    <loc>${escapeXml(loc)}</loc>`,
          alternatesMarkup ? alternatesMarkup.trimEnd() : "",
          lastmod ? `    ${lastmod}` : "",
          changefreq ? `    ${changefreq}` : "",
          priority ? `    ${priority}` : "",
          "  </url>",
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
  }

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    urlEntries.join("\n"),
    `</urlset>`,
    "",
  ].join("\n");
};

/**
 * Construit le contenu llms.txt standard (https://llmstxt.org/).
 * Ce fichier aide les LLMs (ChatGPT, Perplexity, Claude, Google AI Overview)
 * a comprendre la structure et l'intention du site pour citer le contenu
 * de maniere pertinente.
 */
export const buildLlmsTxt = (
  metadata: SeoMetadataFile,
  baseUrl: string,
): string => {
  const defaultLocale = metadata.site.defaultLocale ?? "fr";
  const indexablePages = metadata.pages.filter((page) => page.index !== false);

  const resolveLocaleMeta = (
    page: (typeof metadata.pages)[number],
  ): { title: string; description: string } => {
    const meta =
      page.locales?.[defaultLocale] ?? Object.values(page.locales ?? {})[0];
    return {
      title: meta?.title ?? page.id,
      description: meta?.description ?? "",
    };
  };

  const buildLink = (page: (typeof metadata.pages)[number]): string => {
    const path = page.id === "home" ? "/" : page.path;
    const href = new URL(
      buildLocalizedPath(defaultLocale, path),
      baseUrl,
    ).toString();
    const { title, description } = resolveLocaleMeta(page);
    const desc = description ? `: ${description}` : "";
    return `- [${title}](${href})${desc}`;
  };

  const site = metadata.global?.localBusiness as
    | { name?: string; description?: string; founder?: { name?: string } }
    | undefined;
  const siteName = site?.name ?? "Asili Design";
  const siteDescription = site?.description ?? "";
  const founderName = site?.founder?.name ?? "Tim Moyence";

  // Toutes les pages formations (hub + formations + toolkits) sont considerees
  // comme services : prefixe "formations" absorbe les nouvelles formations
  // ajoutees via la registry sans toucher cette liste.
  const servicePages = indexablePages.filter(
    (p) =>
      ["offer", "growth-audit"].includes(p.id) ||
      p.id === "formations" ||
      p.id.startsWith("formations-"),
  );
  const aboutPages = indexablePages.filter((p) =>
    ["presentation", "client-project"].includes(p.id),
  );
  const appPages = indexablePages.filter((p) =>
    ["weather", "budget", "sebastian"].includes(p.id),
  );
  const contactPages = indexablePages.filter((p) => p.id === "contact");
  const legalPages = indexablePages.filter((p) =>
    ["terms", "privacy", "cookie-settings"].includes(p.id),
  );

  const section = (title: string, pages: typeof indexablePages): string[] => {
    if (pages.length === 0) return [];
    return [`## ${title}`, "", ...pages.map(buildLink), ""];
  };

  const homeMeta = indexablePages.find((p) => p.id === "home");
  const homeTagline = homeMeta ? resolveLocaleMeta(homeMeta).description : "";

  const lines: string[] = [
    `# ${siteName}${founderName ? ` — ${founderName}` : ""}`,
    "",
    homeTagline
      ? `> ${homeTagline}`
      : siteDescription
        ? `> ${siteDescription}`
        : "",
    "",
    ...section("Services", servicePages),
    ...section("A propos", aboutPages),
    ...section("Applications metier", appPages),
    ...section("Contact", contactPages),
    ...section("Legal", legalPages),
  ];

  return lines.filter((line) => line !== undefined).join("\n") + "\n";
};

/**
 * Construit le contenu robots.txt avec un bloc `User-agent: *` par defaut
 * puis un bloc par user-agent IA (P1.7) listant les `Disallow` des pages
 * non indexables + un `Allow: /` explicite.
 */
export const buildRobotsTxt = (
  metadata: SeoMetadataFile,
  baseUrl: string,
): string => {
  const locales = metadata.site.locales ?? [];
  const disallowPaths = new Set<string>();

  for (const page of metadata.pages) {
    if (page.index !== false) continue;

    // Skip route-parameter patterns ("/foo/:token") : the literal `:token`
    // never matches a real URL, so the Disallow line is dead weight that
    // pollutes robots.txt without restricting any crawl.
    if (page.path.includes(":")) continue;

    // Skip cookie-settings : la page RGPD doit rester crawlable pour que
    // Google puisse lire son <meta name="robots" content="noindex">. Un
    // Disallow bloque le crawl avant que le meta soit vu, ce qui declenche
    // l'alerte GSC "Bloquée par robots.txt" alors que la page est noindex
    // par design.
    if (page.id === "cookie-settings") continue;

    disallowPaths.add(normalizePath(page.path));
    for (const locale of locales) {
      disallowPaths.add(buildLocalizedPath(locale, page.path));
    }
  }

  const buildAgentBlock = (agent: string): string[] => {
    const block = [`User-agent: ${agent}`];
    if (disallowPaths.size === 0) {
      block.push("Allow: /");
    } else {
      for (const path of disallowPaths) {
        block.push(`Disallow: ${path}`);
      }
      block.push("Allow: /");
    }
    return block;
  };

  const lines: string[] = [];
  lines.push(...buildAgentBlock("*"));
  for (const agent of AI_USER_AGENTS) {
    lines.push("");
    lines.push(...buildAgentBlock(agent));
  }

  const sitemapUrl = new URL("/sitemap.xml", baseUrl).toString();
  lines.push("");
  lines.push(`Sitemap: ${sitemapUrl}`);
  return `${lines.join("\n")}\n`;
};

/**
 * Construit le contenu /llms-full.txt (P1.8). Extension proposee au
 * standard llms.txt : agrege pour chaque page indexable son titre, sa
 * description, son URL, son dateModified et ses mots-cles principaux.
 * Les LLMs peuvent ainsi "charger" l'ensemble des pages cles en un
 * seul fetch pour citer le site avec contexte.
 */
export const buildLlmsFullTxt = (
  metadata: SeoMetadataFile,
  baseUrl: string,
): string => {
  const defaultLocale = metadata.site.defaultLocale ?? "fr";
  const indexablePages = metadata.pages.filter((page) => page.index !== false);

  const lines: string[] = [];
  const site = metadata.global?.localBusiness as
    | { name?: string; description?: string }
    | undefined;
  lines.push(`# ${site?.name ?? "Asili Design"} — llms-full`);
  lines.push("");
  lines.push(
    "> Agregation complete du contenu indexable (title, description, URL,",
  );
  lines.push(
    "> dateModified, mots-cles) pour ingestion par moteurs IA generatifs.",
  );
  lines.push(
    "> Format non-standard — extension proposee au standard llmstxt.org.",
  );
  lines.push("");

  for (const page of indexablePages) {
    const meta =
      page.locales[defaultLocale] ?? Object.values(page.locales ?? {})[0];
    if (!meta) continue;
    const path = page.id === "home" ? "/" : page.path;
    const href = new URL(
      buildLocalizedPath(defaultLocale, path),
      baseUrl,
    ).toString();

    lines.push(`## ${meta.title}`);
    lines.push("");
    lines.push(`- URL: ${href}`);
    if (page.lastmod) lines.push(`- Last modified: ${page.lastmod}`);
    if (meta.keywords && meta.keywords.length > 0) {
      lines.push(`- Keywords: ${meta.keywords.slice(0, 10).join(", ")}`);
    }
    lines.push("");
    lines.push(meta.description);
    lines.push("");
  }

  return lines.join("\n") + "\n";
};
