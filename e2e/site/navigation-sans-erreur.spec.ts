import { expect, test } from '@playwright/test';

import { baseSsr, exigerLaPorteSsr } from '../porte-ssr';
import { attendreAngular, sansContenu } from '../vitrine/ouvrir';

test.describe('une navigation interne qui saute sa transition ne lève aucune erreur', () => {
  exigerLaPorteSsr();

  test('REC-11 · /offer → /contact puis retour : aucune erreur de page', async ({ page }) => {
    const erreurs: string[] = [];
    page.on('pageerror', (erreur) => erreurs.push(erreur.message));
    await sansContenu(page);
    await page.goto(`${baseSsr}/fr/offer`, { waitUntil: 'networkidle' });
    await attendreAngular(page);

    await page.locator('nav a[href$="/contact"]').first().click();
    await expect(page).toHaveURL(`${baseSsr}/fr/contact`);
    await page.goBack();
    await expect(page).toHaveURL(`${baseSsr}/fr/offer`);
    await page.evaluate(() => new Promise((suite) => setTimeout(suite, 300)));

    expect(erreurs).toEqual([]);
  });
});
