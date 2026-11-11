import { expect, test, type Locator } from '@playwright/test';
import { zArticleListResponseDto } from '../../contrat/zod.gen';
import { buildRecitDuMatin } from '../../src/testing/factories/article.factory';
import { contrastesInsuffisants } from '../../src/testing/texte/contrastes-insuffisants';
import { intercepterApi, servirJson, servirSansContenu } from '../fixtures';

const veille = buildRecitDuMatin({
  slug: 'morning-brief-2026-11-10',
  published_at: '2026-11-10T05:15:00.000Z',
});

test.use({ contextOptions: { reducedMotion: 'reduce' } });

const sansContrasteInsuffisant = async (zone: Locator): Promise<void> => {
  await expect(async () => {
    expect(await zone.evaluate(contrastesInsuffisants)).toEqual([]);
  }).toPass();
};

test('le texte de /articles et du bandeau cookies tient 4,5:1', async ({ page }) => {
  await intercepterApi(page, (route, chemin) =>
    chemin.endsWith('/articles')
      ? servirJson(route, zArticleListResponseDto, {
          items: [buildRecitDuMatin(), veille],
          next_cursor: null,
        })
      : servirSansContenu(route),
  );
  await page.goto('/articles');
  await page.getByTestId('une').waitFor();
  await page.evaluate(() => document.fonts.ready);

  const bandeau = page.locator('app-cookie-banner');
  await expect(bandeau.getByTestId('bandeau-cookies-compris')).toBeVisible();
  expect(await bandeau.evaluate(contrastesInsuffisants)).toEqual([]);
  expect(await page.locator('#main-content').evaluate(contrastesInsuffisants)).toEqual([]);
});

test('le bouton du bandeau cookies tient 4,5:1 au survol', async ({ page }) => {
  await intercepterApi(page, (route) => servirSansContenu(route));
  await page.goto('/');
  const bandeau = page.locator('app-cookie-banner');
  await bandeau.getByTestId('bandeau-cookies-compris').hover();

  await sansContrasteInsuffisant(bandeau);
  await expect(bandeau.getByTestId('bandeau-cookies-compris')).toBeVisible();
});

test('le texte de la section sombre du site tient 4,5:1', async ({ page }) => {
  await intercepterApi(page, (route) => servirSansContenu(route));
  await page.goto('/presentation');
  const sombre = page.locator('.theme-night').first();
  await sombre.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);

  await sansContrasteInsuffisant(sombre);
  await expect(sombre).toHaveCount(1);
});
