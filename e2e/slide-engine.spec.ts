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

  test.skip('/formations/ia-solopreneurs : toggle fullscreen via bouton — non rejouable en Chromium headless (requestFullscreen sans gesture natif)', async ({
    page,
  }) => {
    await page.goto('/formations/ia-solopreneurs');
    const btn = page.getByTestId('slide-deck-fullscreen-toggle');
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.locator('swiper-container')).toBeVisible();
  });

  test('/slides/library : route accessible avec meta noindex', async ({ page }) => {
    await page.goto('/slides/library');
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
    expect(robots).toContain('nofollow');
  });

  test('/slides/library : absente du sitemap.xml', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    if (res.status() === 200) {
      const body = await res.text();
      expect(body).not.toContain('/slides/library');
    }
  });

  test('/formations/audit-seo-diy : CTA toolkit cliquable', async ({ page }) => {
    await page.goto('/formations/audit-seo-diy');
    const cta = page.locator('app-slide-cta a.slide-cta__btn').first();
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/formations/audit-seo-diy/toolkit');
  });
});
