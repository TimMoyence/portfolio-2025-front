import { expect, test } from '@playwright/test';

const CHEMIN_DU_COURS = '/formations/b2-01-traitement-information-chiffree';

const baseSsr = process.env['SSR_BASE_URL'] ?? '';

test.describe('sitemap sans la page B2-01 retirée (L1)', () => {
  test.skip(
    baseSsr === '',
    'hors porte : SSR_BASE_URL absente. La porte la fournit (npm run test:e2e:portail).',
  );

  test('L1 · le sitemap et llms.txt ne publient plus la page B2-01, suivie en séance seulement', async ({
    request,
  }) => {
    const sitemap = await request.get(`${baseSsr}/sitemap.xml`);
    const llms = await request.get(`${baseSsr}/llms.txt`);

    expect([sitemap.status(), llms.status()]).toEqual([200, 200]);
    expect(await sitemap.text()).not.toContain(CHEMIN_DU_COURS);
    expect(await llms.text()).not.toContain(CHEMIN_DU_COURS);
  });
});
