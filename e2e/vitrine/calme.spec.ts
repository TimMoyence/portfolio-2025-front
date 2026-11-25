import { expect, test } from '@playwright/test';
import { ouvrir, sansContenu } from './ouvrir';

test('REC-14 · CON-09 · l accueil ne joue aucune animation CSS en boucle et porte une seule toile de fond, aria-hidden', async ({
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
  await expect(page.locator('canvas.asili-field')).toHaveCount(1);
  await expect(page.locator('canvas.asili-field')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.live-dot, .scroll-hint')).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundImage)).toContain(
    'url(',
  );
});
