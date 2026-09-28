import { expect, test } from '@playwright/test';
import { CODE_DU_COURS, ouvrirLeLivret } from './contexte';

const PX_PAR_MM = 96 / 25.4;

const MARGE_MM = 12;

const A4_MM = { largeur: 210, hauteur: 297 } as const;

const LARGEUR_UTILE_PX = Math.floor((A4_MM.largeur - 2 * MARGE_MM) * PX_PAR_MM);

const HAUTEUR_UTILE_PX = Math.floor((A4_MM.hauteur - 2 * MARGE_MM) * PX_PAR_MM);

const VUES = [
  { vue: 'sujet', pages: 'livret-ecran' },
  { vue: 'corrige', pages: 'livret-corrige' },
] as const;

test.describe(`Banc — livret papier du ${CODE_DU_COURS} imprimé en A4`, () => {
  for (const { vue, pages } of VUES) {
    test(`aucun écran du ${vue} n’est coupé entre deux pages A4`, async ({ page }, testInfo) => {
      await ouvrirLeLivret(page);
      await page.getByTestId(`livret-vue-${vue}`).click();
      const ecrans = page.getByTestId(pages);
      await expect(ecrans.first()).toBeVisible();

      await page.setViewportSize({ width: LARGEUR_UTILE_PX, height: HAUTEUR_UTILE_PX });
      await page.emulateMedia({ media: 'print' });
      const mesures = await ecrans.evaluateAll((sections) =>
        sections.map((section) => ({
          ecran: section.getAttribute('data-ecran') ?? '',
          hauteur: Math.ceil(
            (section.querySelector('app-slide-activity') ?? section).getBoundingClientRect().height,
          ),
        })),
      );
      const pdf = await page.pdf({
        path: testInfo.outputPath(`livret-${vue}.pdf`),
        format: 'A4',
        printBackground: false,
        margin: {
          top: `${MARGE_MM}mm`,
          bottom: `${MARGE_MM}mm`,
          left: `${MARGE_MM}mm`,
          right: `${MARGE_MM}mm`,
        },
      });
      await testInfo.attach(`livret-${vue}.pdf`, { body: pdf, contentType: 'application/pdf' });

      expect(mesures.length).toBeGreaterThan(0);
      expect(mesures.filter(({ hauteur }) => hauteur > HAUTEUR_UTILE_PX)).toEqual([]);
    });
  }
});
