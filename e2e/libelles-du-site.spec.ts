import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { libellesColles } from '../src/testing/libelles-colles';
import { intercepterApi, servirSansContenu } from './fixtures';

const PAGES_DU_SITE = (
  JSON.parse(readFileSync('src/assets/seo/seo-metadata.json', 'utf8')) as {
    pages: readonly { path: string }[];
  }
).pages
  .map(({ path }) => path)
  .filter((chemin) => !chemin.includes(':'));

const TEXTE_DESSINE_LETTRE_A_LETTRE = '.nf-code';

for (const [poste, viewport] of [
  ['ordinateur', { width: 1280, height: 900 }],
  ['téléphone', { width: 390, height: 844 }],
] as const) {
  test(`aucun libellé ne se colle ni ne se chevauche sur les pages du site · ${poste}`, async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await intercepterApi(page, (route) => servirSansContenu(route));
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const colles: Record<string, readonly string[]> = {};
    for (const chemin of PAGES_DU_SITE) {
      await page.goto(chemin);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      const bandeau = page.locator('app-cookie-banner');
      const duBandeau =
        (await bandeau.count()) > 0
          ? await bandeau.evaluate(libellesColles, 'toutes' as const)
          : [];
      await page.addStyleTag({
        content: `app-cookie-banner { display: none !important; } ${TEXTE_DESSINE_LETTRE_A_LETTRE} { visibility: hidden !important; }`,
      });
      const trouves = [
        ...duBandeau,
        ...(await page.locator('body').evaluate(libellesColles, 'toutes' as const)),
      ];
      if (trouves.length > 0) {
        colles[chemin] = trouves;
      }
    }

    expect(colles).toEqual({});
  });
}
