import { APP_BASE_HREF } from "@angular/common";
import { CommonEngine, isMainModule } from "@angular/ssr/node";
import express from "express";
import fs from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import bootstrap from "./main.server";
import type { SeoMetadataFile } from "./app/core/seo/seo-metadata.model";
import { isClientOnlyRoute, loadCsrShell } from "./server/csr-shell";
import {
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildRobotsTxt,
  buildSitemapXml,
} from "./server/seo-builders";
import { injectSeoHead, isKnownRoute } from "./server/seo-injector";
import {
  LOCALE_BARE_PATH,
  LOCALE_PREFIX_RE,
  STRIP_LOCALE_RE,
  buildBaseUrlFromRequest,
} from "./server/url-utils";

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
 * le trailing slash (sauf racine / et chemins locale-seul /fr/, /en/).
 *
 * Les chemins /fr/ et /en/ sont exempts car le reverse-proxy (nginx
 * ou Cloudflare) ajoute systematiquement un trailing slash sur ces
 * chemins, ce qui cree une boucle 301 si on le retire.
 */
app.use((req, res, next) => {
  const original = req.path;
  let normalized = original.replace(/\/{2,}/g, "/");
  if (
    normalized.length > 1 &&
    normalized.endsWith("/") &&
    !LOCALE_BARE_PATH.test(normalized)
  ) {
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

/**
 * Sert le fichier /llms-full.txt (P1.8) : agregation complete du contenu
 * indexable pour les moteurs IA generatifs. Extension du standard llms.txt
 * proposee pour faciliter l'ingestion multi-pages en un seul fetch.
 */
app.get("/llms-full.txt", (req, res) => {
  const metadata = loadSeoMetadata();
  if (!metadata) {
    res.status(404).type("text/plain").send("llms-full.txt not available");
    return;
  }

  const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
  const content = buildLlmsFullTxt(metadata, baseUrl);
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
    redirect: false,
  }),
);
app.use(
  "/en",
  express.static(resolve(browserDistFolder, "en"), {
    maxAge: "1y",
    index: false,
    redirect: false,
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
    redirect: false,
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
app.use(
  express.static(browserDistFolder, {
    maxAge: "1y",
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get("**", (req, res, next) => {
  const { protocol, originalUrl, headers } = req;

  // Extraire la locale depuis l'URL pour servir le bon index.server.html.
  // Chaque locale a son propre bundle SSR (traductions, <base href>, lang).
  // On resout dynamiquement pour eviter les problemes de cross-locale.
  const localeMatch = originalUrl.match(LOCALE_PREFIX_RE);
  const urlLocale = localeMatch ? localeMatch[1] : null;
  const baseHref = urlLocale ? `/${urlLocale}` : "/";

  // Servir les fichiers HTML pre-rendus (SSG au build) si disponibles.
  // Les fichiers pre-rendus contiennent le contenu complet (meta, texte, JSON-LD)
  // et ne dependent pas du rendu SSR dynamique (CommonEngine) qui peut echouer
  // silencieusement en production.
  if (urlLocale) {
    const routePath = originalUrl
      .replace(STRIP_LOCALE_RE, "")
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
      const normalizedRoutePath = routePath === "" ? "/" : `/${routePath}`;
      const isNotFound =
        metadata !== null && !isKnownRoute(normalizedRoutePath, metadata);
      if (metadata) {
        const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
        html = injectSeoHead(html, metadata, originalUrl, baseUrl);
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Language", urlLocale);
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=14400");
      res.setHeader("X-Content-Type-Options", "nosniff");
      if (isNotFound) {
        res.status(404);
      }
      return void res.send(html);
    }

    // Routes client-only : servir la coquille CSR, pas de SSR.
    // Le client gère le routing après hydratation (lecture du token localStorage).
    if (isClientOnlyRoute(routePath)) {
      const shell = loadCsrShell(urlLocale, browserDistFolder);
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
        const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
        html = injectSeoHead(html, metadata, originalUrl, baseUrl);
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
