import { expect, test } from '@playwright/test';
import { ouvrir, sansContenu } from './ouvrir';

test('REC-14 · l accueil ne joue aucune animation en boucle et ne dessine aucun fond animé', async ({
  page,
}) => {
  await sansContenu(page);
  await ouvrir(page, '/');
  await page.mouse.move(400, 400);

  const enBoucle = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((animation) => animation.effect?.getTiming().iterations === Infinity)
      .map((animation) =>
        animation instanceof CSSAnimation ? animation.animationName : animation.id,
      ),
  );

  expect(enBoucle).toEqual([]);
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('.live-dot, .scroll-hint')).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundImage)).toContain(
    'url(',
  );
});
