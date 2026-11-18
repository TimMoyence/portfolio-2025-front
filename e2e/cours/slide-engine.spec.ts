import { expect, test } from '@playwright/test';

test.describe('Slide engine', () => {
  test('/formations/ia-solopreneurs : navigation scroll keyboard', async ({ page }) => {
    const currentHash = (): Promise<string> => page.evaluate(() => window.location.hash);

    await page.goto('/formations/ia-solopreneurs');
    await expect(page.locator('app-slide-hero').first()).toBeVisible();

    const atLoad = await currentHash();
    await page.keyboard.press('ArrowDown');
    await expect.poll(currentHash).not.toBe(atLoad);

    const afterFirstPress = await currentHash();
    await page.keyboard.press('ArrowDown');
    await expect.poll(currentHash).not.toBe(afterFirstPress);
  });

  test('/formations/ia-solopreneurs : le bouton passe le deck en plein écran puis l en sort', async ({
    page,
  }) => {
    const enPleinEcran = (): Promise<boolean> =>
      page.evaluate(() => !!document.fullscreenElement?.closest('app-slide-deck'));

    await page.goto('/formations/ia-solopreneurs');
    await page.getByTestId('bandeau-cookies-compris').click();
    const btn = page.getByTestId('slide-deck-fullscreen-toggle');
    await expect(btn).toHaveAttribute('aria-label', 'Présenter en plein écran');

    await btn.click();
    await expect.poll(enPleinEcran).toBe(true);
    await expect(btn).toHaveAttribute('aria-label', 'Quitter le mode présentation');
    await expect(page.locator('swiper-container')).toBeVisible();

    await btn.click();
    await expect.poll(enPleinEcran).toBe(false);
    await expect(btn).toHaveAttribute('aria-label', 'Présenter en plein écran');
  });

  test('/formations/audit-seo-diy : CTA vers le contact cliquable', async ({ page }) => {
    await page.goto('/formations/audit-seo-diy');
    const cta = page.locator('app-slide-cta a.slide-cta__btn').first();
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/contact');
  });
});
