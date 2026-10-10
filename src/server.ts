import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';
import type { SeoMetadataFile } from './app/core/seo/seo-metadata.model';
import { HTTP_RESPONSE_STATUS } from './app/core/ssr/http-response-status';
import { documentCacheControlFor } from './server/document-cache';
import { COURS_EN_SEANCE } from './app/core/config/cours-en-seance';
import { lecteurDePublicationsDeCours } from './server/cours-publication';
import { loadCsrShell } from './server/csr-shell';
import { entetesDeLaRoute, isClientOnlyRoute } from './server/routes-client';
import { registerPermanentRedirects } from './server/redirects';
import { lecteurDArticlesDuSitemap } from './server/article-sitemap';
import { buildLlmsFullTxt, buildLlmsTxt, buildRobotsTxt } from './server/seo-builders';
import { buildSecurityHeaders } from './server/security-headers';
import { injectSeoHead, isKnownRoute } from './server/seo-injector';
import { routeDuSitemap } from './server/sitemap-route';
import { ALLOWED_HOSTS, buildBaseUrlFromRequest, cheminCanonique } from './server/url-utils';
import { LOCALES_DU_SITE } from './app/core/config/locales';
import { routeSansLocale } from './app/core/seo/chemins';
import { localeParDefaut } from './app/core/seo/pages-seo';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));

const distRoot = resolve(serverDistFolder, '../..');

const browserDistFolder = resolve(distRoot, 'browser');

// Le container peut recevoir des requetes pour une autre locale (nginx, fallback),
// donc on resout dynamiquement le bon index.server.html selon l'URL.
const defaultIndexHtml = join(serverDistFolder, 'index.server.html');
const serverRoot = resolve(serverDistFolder, '..');

const resolveIndexHtml = (locale: string | null): string => {
  if (!locale) return defaultIndexHtml;
  const localeIndex = join(serverRoot, locale, 'index.server.html');
  if (fs.existsSync(localeIndex)) return localeIndex;
  return defaultIndexHtml;
};

const app = express();
app.disable('x-powered-by');

const poserLesEntetes = (res: Response, entetes: Readonly<Record<string, string>>): void => {
  for (const [nom, valeur] of Object.entries(entetes)) {
    res.setHeader(nom, valeur);
  }
};

app.use((req, res, next) => {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  poserLesEntetes(res, buildSecurityHeaders({ isHttps }));
  next();
});

app.use((req, res, next) => {
  const canonique = cheminCanonique(req.path);
  if (canonique !== req.path) {
    const query = req.originalUrl.includes('?')
      ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
      : '';
    res.redirect(301, canonique + query);
    return;
  }
  next();
});

const commonEngine = new CommonEngine({
  allowedHosts: [...ALLOWED_HOSTS],
});

const SEO_METADATA_CANDIDATES = [
  resolve(browserDistFolder, 'fr/assets/seo/seo-metadata.json'),
  resolve(browserDistFolder, 'en/assets/seo/seo-metadata.json'),
  resolve(process.cwd(), 'src/assets/seo/seo-metadata.json'),
];

let cachedSeoMetadata: SeoMetadataFile | null = null;

const loadSeoMetadata = (): SeoMetadataFile | null => {
  if (cachedSeoMetadata) return cachedSeoMetadata;

  for (const candidate of SEO_METADATA_CANDIDATES) {
    if (!fs.existsSync(candidate)) continue;
    try {
      const raw = fs.readFileSync(candidate, 'utf-8');
      cachedSeoMetadata = JSON.parse(raw) as SeoMetadataFile;
      return cachedSeoMetadata;
    } catch {
      // Ignore invalid metadata and fall back to the next candidate.
    }
  }

  return null;
};

const loadArticleSitemap = lecteurDArticlesDuSitemap({
  apiBaseUrl: process.env['PORTFOLIO_ARTICLE_API_URL'],
  fetch: (url, init) => fetch(url, init),
  journal: console,
});

const loadCoursPublications = lecteurDePublicationsDeCours({
  apiBaseUrl: process.env['PORTFOLIO_ARTICLE_API_URL'],
  slugs: COURS_EN_SEANCE,
  fetch: (url, init) => fetch(url, init),
  journal: console,
});

app.get(
  '/sitemap.xml',
  routeDuSitemap({
    lireMetadata: loadSeoMetadata,
    lireArticles: loadArticleSitemap,
    lirePublicationsDeCours: loadCoursPublications,
    baseUrlDe: buildBaseUrlFromRequest,
  }),
);

app.get('/robots.txt', (req, res) => {
  const metadata = loadSeoMetadata();
  const baseUrl = buildBaseUrlFromRequest(req, metadata?.site.baseUrl);

  if (!metadata) {
    res.type('text/plain').send(`User-agent: *\nDisallow:\nSitemap: ${baseUrl}/sitemap.xml\n`);
    return;
  }

  const robots = buildRobotsTxt(metadata, baseUrl);
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.type('text/plain').send(robots);
});

for (const [fichier, construire] of [
  ['llms.txt', buildLlmsTxt],
  ['llms-full.txt', buildLlmsFullTxt],
] as const) {
  app.get(`/${fichier}`, (req, res) => {
    const metadata = loadSeoMetadata();
    if (!metadata) {
      res.status(404).type('text/plain').send(`${fichier} not available`);
      return;
    }

    const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
    const content = construire(metadata, baseUrl);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.type('text/plain').send(content);
  });
}

app.get('/BingSiteAuth.xml', (_req, res) => {
  res
    .type('application/xml')
    .send(
      `<?xml version="1.0"?>\n<users>\n\t<user>86F57D63382B5EEFCB5BFE5B78CCD868</user>\n</users>`,
    );
});

const OPTIONS_STATIQUES = { maxAge: '1y', index: false, redirect: false } as const;

for (const locale of LOCALES_DU_SITE) {
  app.use(`/${locale}`, express.static(resolve(browserDistFolder, locale), OPTIONS_STATIQUES));
}

app.use('/assets', express.static(resolve(browserDistFolder, 'fr/assets'), OPTIONS_STATIQUES));

registerPermanentRedirects(app);

app.use(express.static(browserDistFolder, OPTIONS_STATIQUES));

const prerenderedFileOf = (urlLocale: string, route: string): string | null => {
  const candidate = resolve(browserDistFolder, urlLocale, route.slice(1) || '.', 'index.html');
  if (!candidate.startsWith(browserDistFolder)) return null;
  return fs.existsSync(candidate) ? candidate : null;
};

const sendPrerendered = (
  req: Request,
  res: Response,
  input: { urlLocale: string; route: string; file: string },
): void => {
  const { urlLocale, route, file } = input;
  const metadata = loadSeoMetadata();
  let html = fs.readFileSync(file, 'utf-8');
  if (metadata) {
    const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
    html = injectSeoHead(html, metadata, req.originalUrl, baseUrl);
    if (!isKnownRoute(route, metadata)) {
      res.status(404);
    }
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Language', urlLocale);
  res.setHeader('Cache-Control', documentCacheControlFor(res.statusCode));
  res.send(html);
};

const sendCsrShell = (res: Response, input: { urlLocale: string; baseHref: string }): boolean => {
  const { urlLocale, baseHref } = input;
  const shell = loadCsrShell(urlLocale, browserDistFolder);
  if (!shell) return false;
  const withBase = shell.replace(/<base\s+href="[^"]*"\s*\/?>/, `<base href="${baseHref}/" />`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Language', urlLocale);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.send(withBase);
  return true;
};

// publicPath doit pointer vers le dossier de la locale pour que
// CommonEngine trouve les stylesheets hashees (styles-XXXX.css)
// qui sont dans browser/fr/ ou browser/en/, pas browser/.
const ssrPublicPathOf = (urlLocale: string | null): string =>
  urlLocale ? resolve(browserDistFolder, urlLocale) : browserDistFolder;

const renderWithSsr = (
  req: Request,
  res: Response,
  next: NextFunction,
  input: { urlLocale: string | null; baseHref: string },
): void => {
  const { urlLocale, baseHref } = input;
  const { protocol, originalUrl, headers } = req;
  let status = 200;
  commonEngine
    .render({
      bootstrap,
      documentFilePath: resolveIndexHtml(urlLocale),
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: ssrPublicPathOf(urlLocale),
      providers: [
        { provide: APP_BASE_HREF, useValue: baseHref },
        {
          provide: HTTP_RESPONSE_STATUS,
          useValue: { set: (code: number) => (status = Math.max(status, code)) },
        },
      ],
    })
    .then((rendered) => {
      res.status(status);
      const metadata = loadSeoMetadata();
      let html = rendered;
      if (metadata) {
        const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
        html = injectSeoHead(html, metadata, originalUrl, baseUrl);
      }
      res.setHeader('Content-Language', urlLocale ?? localeParDefaut(metadata));
      res.setHeader('Cache-Control', documentCacheControlFor(status));
      res.send(html);
    })
    .catch((err) => next(err));
};

app.get('**', (req, res, next) => {
  const { locale, route } = routeSansLocale(req.originalUrl, LOCALES_DU_SITE);
  const urlLocale = locale ?? null;
  const baseHref = urlLocale ? `/${urlLocale}` : '/';
  poserLesEntetes(res, entetesDeLaRoute(route));

  if (urlLocale) {
    const prerendered = prerenderedFileOf(urlLocale, route);
    if (prerendered) {
      sendPrerendered(req, res, { urlLocale, route, file: prerendered });
      return;
    }
    if (isClientOnlyRoute(route) && sendCsrShell(res, { urlLocale, baseHref })) {
      return;
    }
  }

  renderWithSsr(req, res, next, { urlLocale, baseHref });
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}
