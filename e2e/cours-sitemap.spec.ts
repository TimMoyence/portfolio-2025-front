import { expect, test } from '@playwright/test';

import { baseSsr, exigerLaPorteSsr } from './porte-ssr';

const CHEMIN_DU_COURS = '/formations/b2-01-traitement-information-chiffree';

test.describe('sitemap sans la page B2-01 retirée (L1)', () => {
  exigerLaPorteSsr();

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
