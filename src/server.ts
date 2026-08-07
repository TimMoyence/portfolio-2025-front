import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
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

/**
 * Les chemins /fr/ et /en/ sont exempts de la normalisation car le reverse-proxy (nginx
 * ou Cloudflare) ajoute systematiquement un trailing slash sur ces
 * chemins, ce qui cree une boucle 301 si on le retire.
 */
app.use((req, res, next) => {
  const original = req.path;
  let normalized = original.replace(/\/{2,}/g, '/');
  if (normalized.length > 1 && normalized.endsWith('/') && !LOCALE_BARE_PATH.test(normalized)) {
    normalized = normalized.replace(/\/+$/, '');
  }
  if (normalized !== original) {
    const query = req.originalUrl.includes('?')
      ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
      : '';
    return void res.redirect(301, normalized + query);
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

app.get('**', (req, res, next) => {
  const { protocol, originalUrl, headers } = req;

  const localeMatch = originalUrl.match(LOCALE_PREFIX_RE);
  const urlLocale = localeMatch ? localeMatch[1] : null;
  const baseHref = urlLocale ? `/${urlLocale}` : '/';

  // Les fichiers pre-rendus (SSG au build) sont servis en priorite : ils ne
  // dependent pas du rendu SSR dynamique (CommonEngine), qui peut echouer
  // silencieusement en production.
  if (urlLocale) {
    const routePath = originalUrl.replace(STRIP_LOCALE_RE, '').split('?')[0].split('#')[0];
    const prerendered = resolve(browserDistFolder, urlLocale, routePath || '.', 'index.html');
    if (prerendered.startsWith(browserDistFolder) && fs.existsSync(prerendered)) {
      const metadata = loadSeoMetadata();
      let html = fs.readFileSync(prerendered, 'utf-8');
      const normalizedRoutePath = routePath === '' ? '/' : `/${routePath}`;
      const isNotFound = metadata !== null && !isKnownRoute(normalizedRoutePath, metadata);
      if (metadata) {
        const baseUrl = buildBaseUrlFromRequest(req, metadata.site.baseUrl);
        html = injectSeoHead(html, metadata, originalUrl, baseUrl);
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Language', urlLocale);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=14400');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (isNotFound) {
        res.status(404);
      }
      return void res.send(html);
    }

    if (isClientOnlyRoute(routePath)) {
      const shell = loadCsrShell(urlLocale, browserDistFolder);
      if (shell) {
        const withBase = shell.replace(
          /<base\s+href="[^"]*"\s*\/?>/,
          `<base href="${baseHref}/" />`,
        );
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Language', urlLocale);
        res.setHeader('Cache-Control', 'private, no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return void res.send(withBase);
      }
    }
  }

  const documentFilePath = resolveIndexHtml(urlLocale);

  // publicPath doit pointer vers le dossier de la locale pour que
  // CommonEngine trouve les stylesheets hashees (styles-XXXX.css)
  // qui sont dans browser/fr/ ou browser/en/, pas browser/.
  const ssrPublicPath = urlLocale ? resolve(browserDistFolder, urlLocale) : browserDistFolder;

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
      res.setHeader('Content-Language', urlLocale ?? metadata?.site.defaultLocale ?? 'fr');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=14400');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.send(html);
    })
    .catch((err) => next(err));
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}
