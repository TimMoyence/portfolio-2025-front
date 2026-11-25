import { expect, test } from '@playwright/test';
import { ouvrir } from '../ouvrir';
import { contourDeLaPremiereCarteSurvolee, image, sansMouvement, surLaToile } from './toile';

surLaToile();

test.describe('écran sans survol', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('CON-05 · une carte pointée sur un écran sans survol ne reçoit aucun contour', async ({
    page,
  }) => {
    await ouvrir(page, '/');
    expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(false);

    expect(await contourDeLaPremiereCarteSurvolee(page)).toBeLessThan(8);
  });
});

test('CON-06 · un navigateur qui refuse le dessin 2D ne lève aucune erreur', async ({ page }) => {
  const erreurs: string[] = [];
  page.on('pageerror', ({ message }) => erreurs.push(message));
  page.on('console', (message) => {
    if (message.type() === 'error') erreurs.push(message.text());
  });
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: () => null });
  });

  await ouvrir(page, '/');
  await page.locator('.cta').first().scrollIntoViewIfNeeded();
  await page.clock.runFor(500);
  await page.mouse.move(600, 400);
  await page.clock.runFor(200);

  expect(erreurs).toEqual([]);
});

test('CON-07 · passer à « réduire » en cours de visite fige l image', async ({ page }) => {
  await ouvrir(page, '/');
  await page.clock.runFor(300);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.runFor(100);

  const figee = await image(page);
  await page.clock.runFor(1000);
  expect(await image(page)).toBe(figee);
});

test.describe('sans mouvement', () => {
  sansMouvement();

  test('CON-01 · une navigation client garde les mêmes points : aucun nouveau tirage', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const tirer = crypto.getRandomValues.bind(crypto);
      let tirages = 0;
      Object.defineProperty(crypto, 'getRandomValues', {
        value: <T extends ArrayBufferView>(tableau: T): T => {
          tirages += 1;
          return tirer(tableau as unknown as Uint32Array) as unknown as T;
        },
      });
      Object.defineProperty(window, 'tirages', { get: () => tirages });
    });
    const tirages = () => page.evaluate(() => Number(Reflect.get(window, 'tirages')));

    await ouvrir(page, '/');
    await page.clock.runFor(300);
    const avant = await tirages();
    expect(avant).toBeGreaterThan(0);

    await page.locator('a[href="/offer"]').first().click();
    await expect(page).toHaveURL(/\/offer$/);
    await page.clock.runFor(300);
    expect(await tirages()).toBe(avant);
  });
});
