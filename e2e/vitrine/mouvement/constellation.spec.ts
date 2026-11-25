import { expect, test } from '@playwright/test';
import { ouvrir } from '../ouvrir';
import {
  TOILE_DE_FOND,
  contourDeLaPremiereCarteSurvolee,
  exigerUnPointSurChaque,
  image,
  opaciteAutour,
  placer,
  sansMouvement,
  surLaToile,
} from './toile';

surLaToile();

test.describe('sans mouvement', () => {
  sansMouvement();

  test('CON-05 · CON-07 · chaque étape de la méthode porte un point, et l image reste immobile', async ({
    page,
  }) => {
    await ouvrir(page, '/');
    await placer(page, 'app-asili-method', 100);
    await page.clock.runFor(300);

    await exigerUnPointSurChaque(page, 'app-asili-method >> nth=0 >> .num');
    const avant = await image(page);
    await page.clock.runFor(1000);
    expect(await image(page)).toBe(avant);
  });
});

test.describe('avec mouvement', () => {
  test('CON-02 · la constellation dérive d une image à l autre', async ({ page }) => {
    await ouvrir(page, '/');
    const avant = await image(page);
    await page.clock.runFor(400);
    expect(await image(page)).not.toBe(avant);
  });

  test('CON-08 · onglet caché, l image s arrête ; au retour, elle reprend', async ({ page }) => {
    await ouvrir(page, '/');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.runFor(100);
    const cachee = await image(page);
    await page.clock.runFor(1000);
    expect(await image(page)).toBe(cachee);

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.runFor(400);
    expect(await image(page)).not.toBe(cachee);
  });

  test('CON-03 · le pointeur est un point du réseau : des traits partent de lui', async ({
    page,
  }) => {
    await ouvrir(page, '/');
    await page.mouse.move(675, 470, { steps: 5 });
    await page.clock.runFor(1500);

    expect(await opaciteAutour(page, TOILE_DE_FOND, 675, 470, 2)).toBeGreaterThan(0);
  });

  test('CON-05 · une carte survolée porte un contour de 8 points à 12 px de sa boîte', async ({
    page,
  }) => {
    await ouvrir(page, '/');

    expect(await contourDeLaPremiereCarteSurvolee(page)).toBe(8);
  });
});
