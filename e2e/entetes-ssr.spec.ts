import { expect, test, type Request } from '@playwright/test';

import { baseSsr, exigerLaPorteSsr } from './porte-ssr';

test.describe('le serveur SSR ne révèle pas sa pile', () => {
  exigerLaPorteSsr();

  for (const chemin of ['/fr/', '/fr/page-inexistante']) {
    test(`${chemin} répond sans en-tête x-powered-by`, async ({ request }) => {
      const reponse = await request.get(`${baseSsr}${chemin}`, { maxRedirects: 0 });

      expect(reponse.headers()['x-powered-by']).toBeUndefined();
    });
  }
});

test.describe('le serveur SSR interdit le reniflage de type sur toute réponse', () => {
  exigerLaPorteSsr();

  for (const chemin of [
    '/fr/',
    '/fr/page-inexistante',
    '/fr/contact/',
    '/home',
    '/robots.txt',
    '/sitemap.xml',
    '/llms.txt',
    '/fr/assets/favicon/site.webmanifest',
  ]) {
    test(`${chemin} porte X-Content-Type-Options: nosniff`, async ({ request }) => {
      const reponse = await request.get(`${baseSsr}${chemin}`, { maxRedirects: 0 });

      expect(reponse.headers()['x-content-type-options']).toBe('nosniff');
    });
  }
});

test.describe('une page ouverte par un lien à jeton ne transmet son URL ni à l’API ni à un tiers', () => {
  exigerLaPorteSsr();

  const jeton = '6f0e3c1a-9b2d-4c8e-a1f7-3d5b9e2c4a10';

  const origine = baseSsr === '' ? '' : new URL(baseSsr).origin;

  for (const chemin of [
    `/fr/verify-email?token=${jeton}`,
    `/fr/reset-password?token=${jeton}`,
    `/fr/formations/ia-solopreneurs/toolkit/${jeton}`,
    `/verify-email?token=${jeton}`,
    `/reset-password?token=${jeton}`,
    `/formations/ia-solopreneurs/toolkit/${jeton}`,
  ]) {
    test(`${chemin} ne confie son jeton qu’aux polices de son propre CSS critique`, async ({
      page,
    }) => {
      await page.route(
        (url) => url.origin !== origine,
        (route) =>
          route.fulfill({
            status: 404,
            headers: { 'access-control-allow-origin': '*' },
            contentType: 'application/problem+json',
            body: JSON.stringify({ status: 404, detail: 'Lien invalide ou expiré.' }),
          }),
      );
      const requetes: Request[] = [];
      page.on('request', (requete) => requetes.push(requete));

      const document = await page.goto(`${baseSsr}${chemin}`, { waitUntil: 'networkidle' });
      const appelParScript = page.waitForRequest(`${origine}/api/v1/portfolio25/sonde-du-referent`);
      await page.evaluate(() =>
        fetch('/api/v1/portfolio25/sonde-du-referent').then(
          () => undefined,
          () => undefined,
        ),
      );
      const entetesDeLAppel = await (await appelParScript).allHeaders();

      const fuites: string[] = [];
      for (const requete of requetes) {
        const porteurs = Object.entries(await requete.allHeaders())
          .filter(([, valeur]) => valeur.includes(jeton))
          .map(([nom]) => nom);
        // Chromium donne l'URL du document aux polices du CSS critique inliné (inlineFonts d'Angular),
        // malgré la politique : elles ne vont qu'à l'origine qui a servi ce document.
        const policeDuDocument =
          requete.resourceType() === 'font' && new URL(requete.url()).origin === origine;
        if (porteurs.length > 0 && !policeDuDocument) {
          fuites.push(`${requete.url()} → ${porteurs.join(', ')}`);
        }
      }
      expect(requetes.length).toBeGreaterThan(1);
      expect(fuites).toEqual([]);
      expect(entetesDeLAppel['referer']).toBeUndefined();
      expect(document?.headers()['referrer-policy']).toBe('no-referrer');
      expect(document?.headers()['cache-control']).toBe('private, no-store');
    });
  }
});

test.describe('le livret papier s’imprime hors du processus du pupitre', () => {
  exigerLaPorteSsr();

  const pupitre = '/fr/cours/presenter/b2-02-series-statistiques';

  test('le livret rompt le groupe de navigation du pupitre qui l’ouvre', async ({ request }) => {
    const livret = await request.get(`${baseSsr}${pupitre}/livret`, { maxRedirects: 0 });
    const ouvreur = await request.get(`${baseSsr}${pupitre}`, { maxRedirects: 0 });

    expect(livret.status()).toBe(200);
    expect(livret.headers()['cross-origin-opener-policy']).toBe('same-origin');
    expect(ouvreur.headers()['cross-origin-opener-policy']).toBeUndefined();
  });
});
