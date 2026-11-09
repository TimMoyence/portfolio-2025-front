import { expect, test } from '@playwright/test';
import { zArticleListResponseDto } from '../../contrat/zod.gen';
import { buildEditionMorningBrief } from '../../src/testing/factories/article.factory';
import { contrastesInsuffisants } from '../../src/testing/texte/contrastes-insuffisants';
import { intercepterApi, servirJson, servirSansContenu } from '../fixtures';

const veille = buildEditionMorningBrief({
  slug: 'morning-brief-2026-11-07',
  published_at: '2026-11-07T04:15:00.000Z',
});

for (const schema of ['light', 'dark'] as const) {
  test(`le texte de /articles et du bandeau cookies tient 4,5:1 · ${schema}`, async ({ page }) => {
    await intercepterApi(page, (route, chemin) =>
      chemin.endsWith('/articles')
        ? servirJson(route, zArticleListResponseDto, {
            items: [buildEditionMorningBrief(), veille],
            next_cursor: null,
          })
        : servirSansContenu(route),
    );
    await page.emulateMedia({ colorScheme: schema, reducedMotion: 'reduce' });
    await page.goto('/articles');
    await page.getByTestId('une').waitFor();
    await page.evaluate(() => document.fonts.ready);

    const bandeau = page.locator('app-cookie-banner');
    await expect(bandeau.getByTestId('bandeau-cookies-compris')).toBeVisible();
    expect(await bandeau.evaluate(contrastesInsuffisants)).toEqual([]);
    expect(await page.locator('#main-content').evaluate(contrastesInsuffisants)).toEqual([]);
  });

  test(`le bouton du bandeau cookies tient 4,5:1 au survol · ${schema}`, async ({ page }) => {
    await intercepterApi(page, (route) => servirSansContenu(route));
    await page.emulateMedia({ colorScheme: schema, reducedMotion: 'reduce' });
    await page.goto('/');
    const bandeau = page.locator('app-cookie-banner');
    await bandeau.getByTestId('bandeau-cookies-compris').hover();

    await expect.poll(() => bandeau.evaluate(contrastesInsuffisants)).toEqual([]);
  });
}
