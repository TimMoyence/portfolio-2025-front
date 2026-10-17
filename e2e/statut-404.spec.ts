import { expect, test } from '@playwright/test';

import { baseSsr, exigerLaPorteSsr } from './porte-ssr';

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

  test('une page existante reste en 200', async ({ request }) => {
    const reponse = await request.get(`${baseSsr}/fr/projets`);

    expect(reponse.status()).toBe(200);
    expect(reponse.headers()['content-type']).toBe('text/html; charset=utf-8');
    expect(reponse.headers()['content-language']).toBe('fr');
  });
});
