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

// index SSR propre à la locale: dist/portfolio-app/server/<locale>/index.server.html
const indexHtml = join(serverDistFolder, "index.server.html");

const app = express();
const commonEngine = new CommonEngine();

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

app.get("/sitemap.xml", (req, res) => {
  const metadata = loadSeoMetadata();
  if (!metadata) {
    res.status(404).type("text/plain").send("Sitemap not available");
    return;
  }

  const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
  const xml = buildSitemapXml(metadata, baseUrl);
  res.setHeader("Content-Type", "application/xml");
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
  res.type("text/plain").send(robots);
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
 * Handle all other requests by rendering the Angular application.
 */
app.get("**", (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
    })
    .then((html) => res.send(html))
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
