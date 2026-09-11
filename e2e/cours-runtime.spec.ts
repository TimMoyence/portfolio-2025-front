import { expect, test } from '@playwright/test';

test.describe('Runtime de cours', () => {
  test('la page de demonstration monte la brique de vote', async ({ page }) => {
    await page.goto('/cours/demo');
    await expect(page.locator('[data-testid="cours-identite"]')).toBeVisible();
    await page.fill('#cours-prenom', 'Theo');
    await page.fill('#cours-nom', 'Martin');
    await page.fill('#cours-email', 'theo.martin@example.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('fp-vote')).toBeVisible();
  });

  test('le vote se verrouille apres le choix', async ({ page }) => {
    await page.goto('/cours/demo');
    await page.evaluate(() => {
      localStorage.setItem(
        'fp.identite',
        JSON.stringify({
          studentKey: '11111111-1111-4111-8111-111111111111',
          prenom: 'Theo',
          nom: 'Martin',
          email: 'theo.martin@example.com',
        }),
      );
    });
    await page.reload();
    const option = page.locator('fp-vote [data-testid="option"]').first();
    await option.click();
    await expect(option).toBeDisabled();
  });

  test('la page reste lisible a 360 pixels de large', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/cours/demo');
    const largeurDocument = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(largeurDocument).toBeLessThanOrEqual(360);
  });
});
