import { expect, test } from '@playwright/test';

test.describe('Parcours public des formations', () => {
  test('l ancienne demonstration technique redirige vers le catalogue', async ({ page }) => {
    await page.goto('/cours/demo');

    await expect(page).toHaveURL(/\/formations$/);
    await expect(page.locator('app-formations-list')).toBeVisible();
    await expect(page.locator('[data-testid="cours-galerie"]')).toHaveCount(0);
    await expect(page.getByText('Chargement du cours…')).toHaveCount(0);
  });

  test('le B2-01 mène à son cours public, qui propose de rejoindre une séance', async ({
    page,
  }) => {
    await page.goto('/formations');

    const card = page.locator('.formation--live');
    await expect(card).toBeVisible();
    await expect(card).toContainText('B2-01');
    await expect(card).toContainText('3 h 30 · 72 écrans');
    await card.getByRole('link', { name: /Consulter/ }).click();

    await expect(page).toHaveURL(/\/formations\/b2-01-traitement-information-chiffree$/);
    await expect(page.getByRole('link', { name: /Rejoindre une séance/ })).toHaveAttribute(
      'href',
      '/cours/rejoindre',
    );
  });

  test('le catalogue reste lisible sur téléphone sans débordement', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/formations');

    const largeurDocument = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(largeurDocument).toBeLessThanOrEqual(390);
    await expect(page.locator('.formation--live')).toBeVisible();
  });
});
