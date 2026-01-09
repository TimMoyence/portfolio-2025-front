import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));

// On est dans dist/portfolio-app/server/<locale>/
// donc distRoot = dist/portfolio-app
const distRoot = resolve(serverDistFolder, '../..');

// dist/portfolio-app/browser
const browserDistFolder = resolve(distRoot, 'browser');

// index SSR propre à la locale: dist/portfolio-app/server/<locale>/index.server.html
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine();

/**
 *  Serve i18n static files correctly
 * - Do NOT serve index.html for asset requests
 * - Serve locale folders explicitly
 */
app.use(
  '/fr',
  express.static(resolve(browserDistFolder, 'fr'), {
    maxAge: '1y',
    index: false,
  }),
);
app.use(
  '/en-US',
  express.static(resolve(browserDistFolder, 'en-US'), {
    maxAge: '1y',
    index: false,
  }),
);

/**
 * si certains assets sont demandés sans préfixe (rare)
 */
app.use(
  '/assets',
  express.static(resolve(browserDistFolder, 'fr/assets'), {
    maxAge: '1y',
    index: false,
  }),
);

/**
 * Serve other static files (css/js/map/woff2/...) if any are at browser root
 * Important: index:false so it never returns HTML for missing files
 */
app.use(express.static(browserDistFolder, { maxAge: '1y', index: false }));

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req, res, next) => {
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
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;
