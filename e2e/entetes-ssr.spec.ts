import { expect, test } from '@playwright/test';

const baseSsr = process.env['SSR_BASE_URL'] ?? '';

test.describe('le serveur SSR ne révèle pas sa pile', () => {
  test.skip(
    baseSsr === '',
    'hors porte : SSR_BASE_URL absente. La porte la fournit (npm run test:e2e:portail).',
  );

  for (const chemin of ['/fr/', '/fr/page-inexistante']) {
    test(`${chemin} répond sans en-tête x-powered-by`, async ({ request }) => {
      const reponse = await request.get(`${baseSsr}${chemin}`, { maxRedirects: 0 });

      expect(reponse.headers()['x-powered-by']).toBeUndefined();
    });
  }
});
