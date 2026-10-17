import { expect, test } from '@playwright/test';

import { baseAnglaise, baseSsr, exigerLaPorteSsr } from './porte-ssr';

const baseDe = (chemin: string): string => (chemin.startsWith('/en/') ? baseAnglaise : baseSsr);

test.describe('une ancre de page reste sur la page', () => {
  exigerLaPorteSsr({ anglaise: true });

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  for (const chemin of ['/fr/formations', '/en/privacy']) {
    test(`le lien d evitement de ${chemin} pose le focus sur le contenu principal`, async ({
      page,
    }) => {
      await page.goto(`${baseDe(chemin)}${chemin}`, { waitUntil: 'networkidle' });

      await page.keyboard.press('Tab');
      await expect(page.locator('a.skip-link')).toBeFocused();
      await page.keyboard.press('Enter');

      await expect(page).toHaveURL(`${baseDe(chemin)}${chemin}#main-content`);
      await expect(page.locator('main#main-content')).toBeFocused();
      await expect(page.locator('main#main-content')).toHaveCSS('outline-style', 'none');
    });
  }

  for (const chemin of ['/fr/privacy', '/en/terms']) {
    test(`le sommaire de ${chemin} arrete la section visee sous la barre`, async ({ page }) => {
      await page.goto(`${baseDe(chemin)}${chemin}`, { waitUntil: 'networkidle' });
      const lien = page.locator('nav.lg-toc a').nth(1);
      const ancre = ((await lien.getAttribute('href')) ?? '').split('#')[1] ?? '';
      const section = page.locator(`[id="${ancre}"]`);

      await lien.click();

      await expect(page).toHaveURL(`${baseDe(chemin)}${chemin}#${ancre}`);
      const basDeLaBarre = await page
        .locator('nav.asili-nav')
        .evaluate((barre) => Math.round(barre.getBoundingClientRect().bottom));
      expect(basDeLaBarre).toBeGreaterThan(0);
      await expect
        .poll(() => section.evaluate((cible) => Math.round(cible.getBoundingClientRect().top)))
        .toBe(basDeLaBarre);
    });
  }
});
