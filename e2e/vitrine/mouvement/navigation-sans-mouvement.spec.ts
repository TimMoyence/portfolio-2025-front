import { expect, test } from '@playwright/test';
import { ouvrir } from '../ouvrir';
import { centres, exigerUnPointSurChaque, preparerLaToile } from './toile';

test.use({
  viewport: { width: 1350, height: 940 },
  deviceScaleFactor: 1,
  contextOptions: { reducedMotion: 'reduce' },
});

test.beforeEach(async ({ page }) => {
  await preparerLaToile(page);
  await page.addInitScript(() => {
    Object.assign(window, {
      scrollTo: () => undefined,
      ResizeObserver: class {
        observe(): void {
          return undefined;
        }
        unobserve(): void {
          return undefined;
        }
        disconnect(): void {
          return undefined;
        }
      },
    });
  });
});

test('CON-07 · sous reduce, la fin de navigation client suffit à poser les formes de la page d arrivée', async ({
  page,
}) => {
  await ouvrir(page, '/projets');
  const [premiere] = await centres(page, 'app-asili-method .num');
  const defilement = Math.round(premiere.y - 880);

  await ouvrir(page, '/offer');
  await page.addStyleTag({ content: '* { overflow-anchor: none !important; }' });
  await page.evaluate((hauteur) => {
    document.documentElement.scrollTop = hauteur;
  }, defilement);
  await page.clock.runFor(100);
  await page.locator('a[href="/projets"]').first().click();
  await expect(page).toHaveURL(/\/projets$/);
  await page.clock.runFor(300);

  expect(await page.evaluate(() => scrollY)).toBe(defilement);
  await exigerUnPointSurChaque(page, 'app-asili-method .num');
});
