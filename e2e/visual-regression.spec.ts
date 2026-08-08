import { test, expect, type Page } from '@playwright/test';

async function forcerChargementDesImagesLazy(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const img of Array.from(document.querySelectorAll('img'))) {
      img.setAttribute('loading', 'eager');
    }
  });
  await page.evaluate(async () => {
    const settled = (img: HTMLImageElement): Promise<unknown> =>
      new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    const pending = Array.from(document.querySelectorAll('img')).filter((img) => !img.complete);
    await Promise.all(pending.map(settled));
  });
}

async function preparerCapture(page: Page, url: string): Promise<void> {
  // À appeler AVANT le `goto` : `_primitives.scss` force
  // `.anim-ready .reveal { opacity: 1 !important }` et `AsiliBackgroundComponent`
  // fige son canvas — sans quoi les sections hors viewport restent à `opacity: 0`,
  // une capture `fullPage` ne scrollant pas.
  // `use: { reducedMotion: "reduce" }` dans `playwright.config.ts` n'a aucun effet
  // en Playwright 1.59.1 : l'option est résolue dans `testInfo.project.use` mais
  // jamais appliquée au contexte. Seul `page.emulateMedia()` fonctionne.
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('body').waitFor({ state: 'visible' });

  await forcerChargementDesImagesLazy(page);
  await page.waitForLoadState('networkidle');
}

test.describe('Regression visuelle — Pages publiques', () => {
  test("page d'accueil — screenshot full-page", async ({ page }) => {
    await preparerCapture(page, '/');

    await expect(page).toHaveScreenshot('accueil.png', { fullPage: true });
  });

  test('page login — screenshot full-page', async ({ page }) => {
    await preparerCapture(page, '/login');

    await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  });

  test('page contact — screenshot full-page', async ({ page }) => {
    await preparerCapture(page, '/contact');

    await expect(page).toHaveScreenshot('contact.png', { fullPage: true });
  });
});
