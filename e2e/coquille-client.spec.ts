import { expect, test } from '@playwright/test';

const baseSsr = process.env['SSR_BASE_URL'] ?? '';

const ROUTES_DE_SEANCE = [
  '/fr/cours/rejoindre',
  '/fr/cours/presenter/b2-01-traitement-information-chiffree',
  '/fr/cours/presenter/b2-01-traitement-information-chiffree/scene/3f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c',
  '/fr/cours/seance/3f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c/synthese',
  '/fr/formations/b2-01-traitement-information-chiffree',
];

test.describe('les routes de séance sont servies en coquille client', () => {
  test.skip(
    baseSsr === '',
    'hors porte : SSR_BASE_URL absente. La porte la fournit (npm run test:e2e:portail).',
  );

  for (const chemin of ROUTES_DE_SEANCE) {
    test(`${chemin} ne rend aucun formulaire avant Angular et ne s indexe pas`, async ({
      request,
    }) => {
      const reponse = await request.get(`${baseSsr}${chemin}`, { maxRedirects: 0 });
      const html = await reponse.text();

      expect(reponse.status()).toBe(200);
      expect(reponse.headers()['x-robots-tag']).toBe('noindex, nofollow');
      expect(reponse.headers()['cache-control']).toBe('private, no-store');
      expect(html).not.toContain('<form');
      expect(html).toContain('<app-root');
    });
  }

  test('une page publique reste rendue par le serveur', async ({ request }) => {
    const reponse = await request.get(`${baseSsr}/fr/articles`);

    expect(reponse.headers()['x-robots-tag']).toBeUndefined();
    expect(await reponse.text()).toContain('ng-server-context');
  });
});
