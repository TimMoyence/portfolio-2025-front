import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';
import type { SeoMetadataFile } from './app/core/seo/seo-metadata.model';
import { isClientOnlyRoute, loadCsrShell } from './server/csr-shell';
import { registerPermanentRedirects } from './server/redirects';
import {
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildRobotsTxt,
  buildSitemapXml,
} from './server/seo-builders';
import { buildSecurityHeaders } from './server/security-headers';
import { injectSeoHead, isKnownRoute } from './server/seo-injector';
import {
  ALLOWED_HOSTS,
  LOCALE_BARE_PATH,
  LOCALE_PREFIX_RE,
  STRIP_LOCALE_RE,
  buildBaseUrlFromRequest,
  trimTrailingSlashes,
} from './server/url-utils';

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

const keepsTrailingSlash = (path: string): boolean => LOCALE_BARE_PATH.test(path);

app.use((req, res, next) => {
  const original = req.path;
  let normalized = original.replace(/\/{2,}/g, '/');
  if (normalized.length > 1 && normalized.endsWith('/') && !keepsTrailingSlash(normalized)) {
    normalized = trimTrailingSlashes(normalized);
  }
  if (normalized !== original) {
    const query = req.originalUrl.includes('?')
      ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
      : '';
    res.redirect(301, normalized + query);
    return;
  }
  next();
});

app.use((req, res, next) => {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const headers = buildSecurityHeaders({ isHttps });
  for (const [name, value] of Object.entries(headers)) {
    res.setHeader(name, value);
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

app.get('/sitemap.xml', (req, res) => {
  const metadata = loadSeoMetadata();
  if (!metadata) {
    res.status(404).type('text/plain').send('Sitemap not available');
    return;
  }

  const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
  const xml = buildSitemapXml(metadata, baseUrl);
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.send(xml);
});

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

app.get('/llms.txt', (req, res) => {
  const metadata = loadSeoMetadata();
  if (!metadata) {
    res.status(404).type('text/plain').send('llms.txt not available');
    return;
  }

  const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
  const content = buildLlmsTxt(metadata, baseUrl);
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.type('text/plain').send(content);
});

app.get('/llms-full.txt', (req, res) => {
  const metadata = loadSeoMetadata();
  if (!metadata) {
    res.status(404).type('text/plain').send('llms-full.txt not available');
    return;
  }

  const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
  const content = buildLlmsFullTxt(metadata, baseUrl);
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.type('text/plain').send(content);
});

app.get('/BingSiteAuth.xml', (_req, res) => {
  res
    .type('application/xml')
    .send(
      `<?xml version="1.0"?>\n<users>\n\t<user>86F57D63382B5EEFCB5BFE5B78CCD868</user>\n</users>`,
    );
});

app.use(
  '/fr',
  express.static(resolve(browserDistFolder, 'fr'), {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);
app.use(
  '/en',
  express.static(resolve(browserDistFolder, 'en'), {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use(
  '/assets',
  express.static(resolve(browserDistFolder, 'fr/assets'), {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

registerPermanentRedirects(app);

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

const DOCUMENT_CACHE_CONTROL = 'public, max-age=3600, s-maxage=14400';

const localeOf = (originalUrl: string): string | null =>
  LOCALE_PREFIX_RE.exec(originalUrl)?.[1] ?? null;

const routePathOf = (originalUrl: string): string =>
  originalUrl.replace(STRIP_LOCALE_RE, '').split('?')[0].split('#')[0];

const prerenderedFileOf = (urlLocale: string, routePath: string): string | null => {
  const candidate = resolve(browserDistFolder, urlLocale, routePath || '.', 'index.html');
  if (!candidate.startsWith(browserDistFolder)) return null;
  return fs.existsSync(candidate) ? candidate : null;
};

const sendPrerendered = (
  req: Request,
  res: Response,
  input: { urlLocale: string; routePath: string; file: string },
): void => {
  const { urlLocale, routePath, file } = input;
  const metadata = loadSeoMetadata();
  let html = fs.readFileSync(file, 'utf-8');
  if (metadata) {
    const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
    html = injectSeoHead(html, metadata, req.originalUrl, baseUrl);
    if (!isKnownRoute(routePath === '' ? '/' : `/${routePath}`, metadata)) {
      res.status(404);
    }
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Language', urlLocale);
  res.setHeader('Cache-Control', DOCUMENT_CACHE_CONTROL);
  res.setHeader('X-Content-Type-Options', 'nosniff');
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
  res.setHeader('X-Content-Type-Options', 'nosniff');
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
  commonEngine
    .render({
      bootstrap,
      documentFilePath: resolveIndexHtml(urlLocale),
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: ssrPublicPathOf(urlLocale),
      providers: [{ provide: APP_BASE_HREF, useValue: baseHref }],
    })
    .then((rendered) => {
      const metadata = loadSeoMetadata();
      let html = rendered;
      if (metadata) {
        const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
        html = injectSeoHead(html, metadata, originalUrl, baseUrl);
      }
      res.setHeader('Content-Language', urlLocale ?? metadata?.site.defaultLocale ?? 'fr');
      res.setHeader('Cache-Control', DOCUMENT_CACHE_CONTROL);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.send(html);
    })
    .catch((err) => next(err));
};

app.get('**', (req, res, next) => {
  const urlLocale = localeOf(req.originalUrl);
  const baseHref = urlLocale ? `/${urlLocale}` : '/';

  if (urlLocale) {
    const routePath = routePathOf(req.originalUrl);
    const prerendered = prerenderedFileOf(urlLocale, routePath);
    if (prerendered) {
      sendPrerendered(req, res, { urlLocale, routePath, file: prerendered });
      return;
    }
    if (isClientOnlyRoute(routePath) && sendCsrShell(res, { urlLocale, baseHref })) {
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
