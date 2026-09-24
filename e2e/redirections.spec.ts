import { expect, test } from '@playwright/test';

const baseSsr = process.env['SSR_BASE_URL'] ?? '';

const REDIRECTIONS_PERMANENTES: ReadonlyArray<readonly [string, string]> = [
  ['/atelier', '/fr/projets'],
  ['/fr/atelier', '/fr/projets'],
  ['/fr/atelier/meteo/app', '/fr/projets'],
  ['/en/atelier/sebastian/app/badges', '/en/projets'],
  ['/fr/commonbudgetTM', '/fr'],
  ['/en/commonbudgetTM', '/en'],
];

test.describe('les pages retirées répondent un vrai 301', () => {
  test.skip(
    baseSsr === '',
    'hors porte : SSR_BASE_URL absente. La porte la fournit (npm run test:e2e:portail).',
  );

  for (const [ancienne, cible] of REDIRECTIONS_PERMANENTES) {
    test(`${ancienne} redirige en 301 vers ${cible}`, async ({ request }) => {
      const reponse = await request.get(`${baseSsr}${ancienne}`, { maxRedirects: 0 });

      expect(reponse.status()).toBe(301);
      expect(reponse.headers()['location']).toBe(cible);
    });
  }
});
