import { APP_BASE_HREF } from "@angular/common";
import { CommonEngine, isMainModule } from "@angular/ssr/node";
import express from "express";
import fs from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import bootstrap from "./main.server";
import type { SeoMetadataFile } from "./app/core/seo/seo-metadata.model";

const serverDistFolder = dirname(fileURLToPath(import.meta.url));

// On est dans dist/portfolio-app/server/<locale>/
// donc distRoot = dist/portfolio-app
const distRoot = resolve(serverDistFolder, "../..");

// dist/portfolio-app/browser
const browserDistFolder = resolve(distRoot, "browser");

// index SSR propre a la locale: dist/portfolio-app/server/<locale>/index.server.html
// Le container peut recevoir des requetes pour une autre locale (nginx, fallback),
// donc on resout dynamiquement le bon index.server.html selon l'URL.
const defaultIndexHtml = join(serverDistFolder, "index.server.html");
const serverRoot = resolve(serverDistFolder, "..");

/** Retourne le index.server.html correspondant a la locale de l'URL. */
const resolveIndexHtml = (locale: string | null): string => {
  if (!locale) return defaultIndexHtml;
  const localeIndex = join(serverRoot, locale, "index.server.html");
  if (fs.existsSync(localeIndex)) return localeIndex;
  return defaultIndexHtml;
};

const app = express();

/**
 * Normalisation d'URL : collapse les slashes multiples et supprime
 * le trailing slash (sauf racine /). Redirige en 301 si l'URL change.
 */
app.use((req, res, next) => {
  const original = req.path;
  let normalized = original.replace(/\/{2,}/g, "/");
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.replace(/\/+$/, "");
  }
  if (normalized !== original) {
    const query = req.originalUrl.includes("?")
      ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
      : "";
    return void res.redirect(301, normalized + query);
  }
  next();
});

const commonEngine = new CommonEngine({
  allowedHosts: [
    "asilidesign.fr",
    "www.asilidesign.fr",
    "localhost",
    "127.0.0.1",
    "portfolio-web-fr",
    "portfolio-web-en",
  ],
});

const SEO_METADATA_CANDIDATES = [
  resolve(browserDistFolder, "fr/assets/seo/seo-metadata.json"),
  resolve(browserDistFolder, "en/assets/seo/seo-metadata.json"),
  resolve(process.cwd(), "src/assets/seo/seo-metadata.json"),
];

let cachedSeoMetadata: SeoMetadataFile | null = null;

const loadSeoMetadata = (): SeoMetadataFile | null => {
  if (cachedSeoMetadata) return cachedSeoMetadata;

  for (const candidate of SEO_METADATA_CANDIDATES) {
    if (!fs.existsSync(candidate)) continue;
    try {
      const raw = fs.readFileSync(candidate, "utf-8");
      cachedSeoMetadata = JSON.parse(raw) as SeoMetadataFile;
      return cachedSeoMetadata;
    } catch {
      // Ignore invalid metadata and fall back to the next candidate.
    }
  }

  return null;
};

const normalizePath = (path: string): string => {
  const clean = path.split("?")[0].split("#")[0];
  const trimmed = clean.replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed ? `/${trimmed}` : "/";
};

const buildLocalizedPath = (locale: string, path: string): string => {
  const normalized = normalizePath(path);
  if (!locale) return normalized;
  if (normalized === "/") return normalizePath(`/${locale}`);
  return normalizePath(`/${locale}${normalized}`);
};

const buildBaseUrlFromRequest = (
  req: express.Request,
  fallback?: string,
): string => {
  const forwardedProto = (req.headers["x-forwarded-proto"] as string)
    ?.split(",")[0]
    ?.trim();
  const forwardedHost = (req.headers["x-forwarded-host"] as string)
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || req.get("host");
  const protocol = forwardedProto || req.protocol;

  if (host) {
    return `${protocol}://${host}`;
  }

  return fallback ?? "https://asilidesign.fr";
};

const buildSitemapXml = (
  metadata: SeoMetadataFile,
  baseUrl: string,
): string => {
  const locales = metadata.site.locales ?? [];
  const activeLocales = locales.length > 0 ? locales : [""];
  const defaultLocale = metadata.site.defaultLocale ?? activeLocales[0];
  const urls = metadata.pages.filter((page) => page.index !== false);
  const urlEntries: string[] = [];

  const escapeXml = (value: string): string =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

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
const buildLlmsTxt = (metadata: SeoMetadataFile, baseUrl: string): string => {
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

  const servicePages = indexablePages.filter((p) =>
    [
      "offer",
      "growth-audit",
      "formations",
      "formations-ia-solopreneurs",
      "formations-ia-solopreneurs-toolkit",
    ].includes(p.id),
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

const buildRobotsTxt = (metadata: SeoMetadataFile, baseUrl: string): string => {
  const locales = metadata.site.locales ?? [];
  const disallowPaths = new Set<string>();

  for (const page of metadata.pages) {
    if (page.index === false) {
      disallowPaths.add(normalizePath(page.path));
      for (const locale of locales) {
        disallowPaths.add(buildLocalizedPath(locale, page.path));
      }
    }
  }

  const lines = ["User-agent: *"];
  if (disallowPaths.size === 0) {
    lines.push("Disallow:");
  } else {
    for (const path of disallowPaths) {
      lines.push(`Disallow: ${path}`);
    }
  }

  const sitemapUrl = new URL("/sitemap.xml", baseUrl).toString();
  lines.push(`Sitemap: ${sitemapUrl}`);
  return `${lines.join("\n")}\n`;
};

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

  // dateModified depuis page.lastmod (cascade : block > page.lastmod)
  if (!enriched["dateModified"] && page.lastmod) {
    enriched["dateModified"] = page.lastmod;
  }

  // datePublished par defaut = dateModified si non fourni
  if (!enriched["datePublished"] && enriched["dateModified"]) {
    enriched["datePublished"] = enriched["dateModified"];
  }

  // author reference vers Person @id partage (sauf pour WebSite/LocalBusiness)
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
  const localeMatch = originalUrl.match(/^\/(fr|en)(?=\/|$)/);
  const locale = localeMatch ? localeMatch[1] : metadata.site.defaultLocale;
  const routePath = originalUrl
    .replace(/^\/(fr|en)\/?/, "")
    .split("?")[0]
    .split("#")[0];
  const normalizedRoute = routePath ? `/${routePath}` : "/";

  const scripts: string[] = [];

  const addScript = (data: Record<string, unknown>): void => {
    const json = JSON.stringify(data).replace(/<\/script>/gi, "<\\/script>");
    scripts.push(`<script type="application/ld+json">${json}</script>`);
  };

  // Schemas globaux (toutes les pages)
  if (metadata.global?.localBusiness) {
    addScript(metadata.global.localBusiness);
  }
  if (metadata.global?.siteNavigation) {
    addScript(metadata.global.siteNavigation);
  }

  // Schema specifique a la page
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

    // BreadcrumbList
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
 * Injecte les scripts JSON-LD dans le HTML avant </head>.
 */
const injectJsonLd = (
  html: string,
  metadata: SeoMetadataFile,
  originalUrl: string,
): string => {
  const scripts = buildJsonLdScripts(metadata, originalUrl);
  if (!scripts) return html;
  return html.replace("</head>", `${scripts}\n</head>`);
};

app.get("/sitemap.xml", (req, res) => {
  const metadata = loadSeoMetadata();
  if (!metadata) {
    res.status(404).type("text/plain").send("Sitemap not available");
    return;
  }

  const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
  const xml = buildSitemapXml(metadata, baseUrl);
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
  res.send(xml);
});

app.get("/robots.txt", (req, res) => {
  const metadata = loadSeoMetadata();
  const baseUrl = buildBaseUrlFromRequest(req, metadata?.site.baseUrl);

  if (!metadata) {
    res
      .type("text/plain")
      .send(`User-agent: *\nDisallow:\nSitemap: ${baseUrl}/sitemap.xml\n`);
    return;
  }

  const robots = buildRobotsTxt(metadata, baseUrl);
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
  res.type("text/plain").send(robots);
});

/**
 * Sert le fichier llms.txt conforme au standard https://llmstxt.org/
 * Permet aux LLMs (ChatGPT, Perplexity, Google AI Overview, Bing Copilot)
 * de decouvrir la structure du site et son intention editoriale.
 */
app.get("/llms.txt", (req, res) => {
  const metadata = loadSeoMetadata();
  if (!metadata) {
    res.status(404).type("text/plain").send("llms.txt not available");
    return;
  }

  const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
  const content = buildLlmsTxt(metadata, baseUrl);
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
  res.type("text/plain").send(content);
});

/** Bing Webmaster Tools — verification XML */
app.get("/BingSiteAuth.xml", (_req, res) => {
  res
    .type("application/xml")
    .send(
      `<?xml version="1.0"?>\n<users>\n\t<user>86F57D63382B5EEFCB5BFE5B78CCD868</user>\n</users>`,
    );
});

/**
 *  Serve i18n static files correctly
 * - Do NOT serve index.html for asset requests
 * - Serve locale folders explicitly
 */
app.use(
  "/fr",
  express.static(resolve(browserDistFolder, "fr"), {
    maxAge: "1y",
    index: false,
  }),
);
app.use(
  "/en",
  express.static(resolve(browserDistFolder, "en"), {
    maxAge: "1y",
    index: false,
  }),
);

/**
 * si certains assets sont demandés sans préfixe (rare)
 */
app.use(
  "/assets",
  express.static(resolve(browserDistFolder, "fr/assets"), {
    maxAge: "1y",
    index: false,
  }),
);

app.get("/home", (_req, res) => {
  return res.redirect(301, "/fr");
});

app.get("/fr/home", (_req, res) => {
  return res.redirect(301, "/fr");
});

app.get("/en/home", (_req, res) => {
  return res.redirect(301, "/en");
});
/**
 * Serve other static files (css/js/map/woff2/...) if any are at browser root
 * Important: index:false so it never returns HTML for missing files
 */
app.use(express.static(browserDistFolder, { maxAge: "1y", index: false }));

/**
 * Détecte les routes qui doivent être rendues côté client uniquement.
 * Pour ces routes, le SSR classique redirige vers /login (le guard ne peut
 * pas lire localStorage côté serveur), ce qui casse le reload. On sert à la
 * place la coquille CSR (index.csr.html) : un HTML minimal avec les scripts
 * Angular, qui laisse le client gérer le routing après hydratation.
 *
 * Les routes listées ici DOIVENT correspondre à celles marquées
 * `RenderMode.Client` dans `src/app/app.routes.server.ts`.
 */
const CLIENT_ONLY_ROUTE_PATTERNS: RegExp[] = [
  /^profil\/?$/,
  /^atelier\/meteo\/app(\/|$)/,
  /^atelier\/budget\/app(\/|$)/,
  /^atelier\/sebastian\/app(\/|$)/,
];

/**
 * Retourne true si la route doit être rendue côté client uniquement.
 */
const isClientOnlyRoute = (routePath: string): boolean => {
  const normalized = routePath.replace(/^\//, "");
  return CLIENT_ONLY_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
};

/**
 * Sert la coquille CSR (index.csr.html) pour les routes client-only.
 * Le chemin est résolu dans le dossier de la locale correspondante.
 * Si la coquille n'existe pas (ex. build dev sans locales), retourne null.
 */
const loadCsrShell = (locale: string | null): string | null => {
  const candidates = [
    locale ? resolve(browserDistFolder, locale, "index.csr.html") : null,
    resolve(browserDistFolder, "index.csr.html"),
  ].filter((p): p is string => p !== null);

  for (const candidate of candidates) {
    if (candidate.startsWith(browserDistFolder) && fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, "utf-8");
    }
  }
  return null;
};

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get("**", (req, res, next) => {
  const { protocol, originalUrl, headers } = req;

  // Extraire la locale depuis l'URL pour servir le bon index.server.html.
  // Chaque locale a son propre bundle SSR (traductions, <base href>, lang).
  // On resout dynamiquement pour eviter les problemes de cross-locale.
  const localeMatch = originalUrl.match(/^\/(fr|en)(?=\/|$)/);
  const urlLocale = localeMatch ? localeMatch[1] : null;
  const baseHref = urlLocale ? `/${urlLocale}` : "/";

  // Servir les fichiers HTML pre-rendus (SSG au build) si disponibles.
  // Les fichiers pre-rendus contiennent le contenu complet (meta, texte, JSON-LD)
  // et ne dependent pas du rendu SSR dynamique (CommonEngine) qui peut echouer
  // silencieusement en production.
  if (urlLocale) {
    const routePath = originalUrl
      .replace(/^\/(fr|en)\/?/, "")
      .split("?")[0]
      .split("#")[0];
    const prerendered = resolve(
      browserDistFolder,
      urlLocale,
      routePath || ".",
      "index.html",
    );
    if (
      prerendered.startsWith(browserDistFolder) &&
      fs.existsSync(prerendered)
    ) {
      const metadata = loadSeoMetadata();
      let html = fs.readFileSync(prerendered, "utf-8");
      if (metadata) {
        html = injectJsonLd(html, metadata, originalUrl);
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Language", urlLocale);
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=14400");
      res.setHeader("X-Content-Type-Options", "nosniff");
      return void res.send(html);
    }

    // Routes client-only : servir la coquille CSR, pas de SSR.
    // Le client gère le routing après hydratation (lecture du token localStorage).
    if (isClientOnlyRoute(routePath)) {
      const shell = loadCsrShell(urlLocale);
      if (shell) {
        // Corriger le <base href> pour la locale courante
        const withBase = shell.replace(
          /<base\s+href="[^"]*"\s*\/?>/,
          `<base href="${baseHref}/" />`,
        );
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Content-Language", urlLocale);
        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
        return void res.send(withBase);
      }
    }
  }

  // Fallback SSR dynamique pour les routes non pre-rendues.
  const documentFilePath = resolveIndexHtml(urlLocale);

  // publicPath doit pointer vers le dossier de la locale pour que
  // CommonEngine trouve les stylesheets hashees (styles-XXXX.css)
  // qui sont dans browser/fr/ ou browser/en/, pas browser/.
  const ssrPublicPath = urlLocale
    ? resolve(browserDistFolder, urlLocale)
    : browserDistFolder;

  commonEngine
    .render({
      bootstrap,
      documentFilePath,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: ssrPublicPath,
      providers: [{ provide: APP_BASE_HREF, useValue: baseHref }],
    })
    .then((html) => {
      const metadata = loadSeoMetadata();
      if (metadata) {
        html = injectJsonLd(html, metadata, originalUrl);
      }
      res.setHeader(
        "Content-Language",
        urlLocale ?? metadata?.site.defaultLocale ?? "fr",
      );
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=14400");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.send(html);
    })
    .catch((err) => next(err));
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env["PORT"] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;
