import { expect, test } from '@playwright/test';
import { COURS_BTS } from '../src/app/core/config/cours-bts';

test.describe('Parcours public des formations', () => {
  test('l ancienne demonstration technique redirige vers le catalogue', async ({ page }) => {
    await page.goto('/cours/demo');

    await expect(page).toHaveURL(/\/formations$/);
    await expect(page.locator('app-formations-list')).toBeVisible();
    await expect(page.locator('[data-testid="cours-galerie"]')).toHaveCount(0);
    await expect(page.getByText('Chargement du cours…')).toHaveCount(0);
  });

  for (const slug of COURS_BTS) {
    const code = slug.slice(0, 5).toUpperCase();

    test(`L1 · le ${code} mène un visiteur au poste étudiant, sans lecture libre`, async ({
      page,
    }) => {
      await page.goto('/formations');

      const card = page.locator('.formation--live').filter({ hasText: code });
      await expect(card).toBeVisible();
      await expect(card).toContainText('3 h 30');
      await expect(card).not.toContainText(/\d écrans/);
      await expect(card).toContainText('À suivre en séance accompagnée');
      await expect(card).not.toContainText('librement');
      await card.getByRole('link', { name: /Consulter/ }).click();

      await expect(page).toHaveURL(new RegExp(`/cours/rejoindre\\?cours=${slug}$`));
      await expect(page.locator('app-slide-deck')).toHaveCount(0);
    });
  }

  test('le catalogue reste lisible sur téléphone sans débordement', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/formations');

    const largeurDocument = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(largeurDocument).toBeLessThanOrEqual(390);
    const cartes = page.locator('.formation--live');
    await expect(cartes).toHaveCount(COURS_BTS.length);
    for (const carte of await cartes.all()) {
      await expect(carte).toBeVisible();
    }
  });
});
