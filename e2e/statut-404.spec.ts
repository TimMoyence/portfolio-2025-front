import { expect, test } from '@playwright/test';

const baseSsr = process.env['SSR_BASE_URL'] ?? '';

test.describe('une page introuvable répond un vrai 404', () => {
  test.skip(
    baseSsr === '',
    'hors porte : SSR_BASE_URL absente. La porte la fournit (npm run test:e2e:portail).',
  );

  for (const chemin of ['/fr/page-inexistante', '/en/page-inexistante']) {
    test(`${chemin} répond 404, en noindex, sans cache long`, async ({ request }) => {
      const reponse = await request.get(`${baseSsr}${chemin}`, { maxRedirects: 0 });
      const html = await reponse.text();

      expect(reponse.status()).toBe(404);
      expect(reponse.headers()['cache-control']).toBe('public, max-age=300, s-maxage=300');
      expect(html).toContain('data-testid="not-found-title"');
      expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/);
    });
  }

  test('une page existante reste en 200', async ({ request }) => {
    expect((await request.get(`${baseSsr}/fr/projets`)).status()).toBe(200);
  });
});
