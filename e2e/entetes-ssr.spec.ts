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

test.describe('le livret papier s’imprime hors du processus du pupitre', () => {
  test.skip(
    baseSsr === '',
    'hors porte : SSR_BASE_URL absente. La porte la fournit (npm run test:e2e:portail).',
  );

  const pupitre = '/fr/cours/presenter/b2-02-series-statistiques';

  test('le livret rompt le groupe de navigation du pupitre qui l’ouvre', async ({ request }) => {
    const livret = await request.get(`${baseSsr}${pupitre}/livret`, { maxRedirects: 0 });
    const ouvreur = await request.get(`${baseSsr}${pupitre}`, { maxRedirects: 0 });

    expect(livret.status()).toBe(200);
    expect(livret.headers()['cross-origin-opener-policy']).toBe('same-origin');
    expect(ouvreur.headers()['cross-origin-opener-policy']).toBeUndefined();
  });
});
