import { expect, test } from '@playwright/test';
import { request as requeteHttp } from 'node:http';

import { baseSsr, exigerLaPorteSsr } from '../porte-ssr';

const reponseBrute = (chemin: string): Promise<{ statut?: number; location?: string }> =>
  new Promise((resoudre, rejeter) => {
    const { hostname, port } = new URL(baseSsr);
    requeteHttp({ hostname, port, path: chemin }, (reponse) => {
      reponse.resume();
      resoudre({ statut: reponse.statusCode, location: reponse.headers.location });
    })
      .on('error', rejeter)
      .end();
  });

test.describe('une page introuvable répond un vrai 404', () => {
  exigerLaPorteSsr();

  for (const chemin of ['/fr/page-inexistante', '/en/page-inexistante']) {
    test(`${chemin} répond 404, en noindex, sans cache long`, async ({ request }) => {
      const reponse = await request.get(`${baseSsr}${chemin}`, { maxRedirects: 0 });
      const html = await reponse.text();

      expect(reponse.status()).toBe(404);
      expect(reponse.headers()['cache-control']).toBe('public, max-age=300, s-maxage=300');
      expect(reponse.headers()['content-type']).toBe('text/html; charset=utf-8');
      expect(reponse.headers()['content-language']).toBe(chemin.slice(1, 3));
      expect(html).toContain('data-testid="not-found-title"');
      expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/);
    });
  }

  for (const [chemin, canonique] of [
    ['/fr/contact/.', '/fr/contact'],
    ['/fr/login/..', '/fr/'],
    ['/fr/zz/../contact', '/fr/contact'],
    ['/x/%2e%2e/fr/contact', '/fr/contact'],
    ['/fr/contact/index.html', '/fr/contact'],
    ['/fr/index.html', '/fr/'],
    ['/fr/%63ontact', '/fr/contact'],
    ['/fr/contact/index%2ehtml', '/fr/contact'],
  ]) {
    test(`${chemin}, reçu tel quel, redirige vers ${canonique}`, async () => {
      expect(await reponseBrute(chemin)).toEqual({ statut: 301, location: canonique });
    });
  }

  for (const chemin of ['/fr/contact%2findex.html', '/fr/index.csr.html']) {
    test(`${chemin}, fichier du build, n est pas servi comme un document`, async () => {
      expect(await reponseBrute(chemin)).toEqual({ statut: 404, location: undefined });
    });
  }

  test('une page existante reste en 200', async ({ request }) => {
    const reponse = await request.get(`${baseSsr}/fr/projets`);

    expect(reponse.status()).toBe(200);
    expect(reponse.headers()['content-type']).toBe('text/html; charset=utf-8');
    expect(reponse.headers()['content-language']).toBe('fr');
  });
});
