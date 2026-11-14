import '@angular/localize/init';
import { expect, test } from '@playwright/test';
import { COURS_EN_SEANCE, dureeDuCoursEnSeance } from '../../src/app/core/config/cours-en-seance';
import { baseAnglaise, exigerLaPorteSsr } from '../porte-ssr';

test.describe('Parcours public des formations', () => {
  test('l ancienne demonstration technique redirige vers le catalogue', async ({ page }) => {
    await page.goto('/cours/demo');

    await expect(page).toHaveURL(/\/formations$/);
    await expect(page.locator('app-formations-list')).toBeVisible();
    await expect(page.locator('[data-testid="cours-galerie"]')).toHaveCount(0);
    await expect(page.getByText('Chargement du cours…')).toHaveCount(0);
  });

  for (const slug of COURS_EN_SEANCE) {
    const code = slug.slice(0, 5).toUpperCase();

    test(`L1 · le ${code} mène un visiteur au poste étudiant, sans lecture libre`, async ({
      page,
    }) => {
      await page.goto('/formations');

      const card = page.locator('.formation--live').filter({ hasText: code });
      await expect(card).toBeVisible();
      await expect(card).toContainText(dureeDuCoursEnSeance(slug));
      await expect(card).not.toContainText(/\d écrans/);
      await expect(card).toContainText('À suivre en séance accompagnée');
      await expect(card).not.toContainText('librement');
      await card.getByRole('link', { name: /Consulter/ }).click();

      await expect(page).toHaveURL(new RegExp(`/cours/rejoindre\\?cours=${slug}$`));
      await expect(page.locator('app-slide-deck')).toHaveCount(0);
    });
  }

  test.describe('en anglais', () => {
    exigerLaPorteSsr({ anglaise: true });

    test('PUB-01 · chaque carte en séance écrit sa durée « 2 h 00 min », d une seule façon', async ({
      page,
    }) => {
      await page.goto(`${baseAnglaise}/en/formations`, { waitUntil: 'domcontentloaded' });

      for (const slug of COURS_EN_SEANCE) {
        const carte = page
          .locator('.formation--live')
          .filter({ hasText: slug.slice(0, 5).toUpperCase() });
        await expect(carte).toContainText(`${dureeDuCoursEnSeance(slug)} min`);
      }
    });
  });

  test('le catalogue reste lisible sur téléphone sans débordement', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/formations');

    const largeurDocument = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(largeurDocument).toBeLessThanOrEqual(390);
    const cartes = page.locator('.formation--live');
    await expect(cartes).toHaveCount(COURS_EN_SEANCE.length);
    for (const carte of await cartes.all()) {
      await expect(carte).toBeVisible();
    }
  });
});
