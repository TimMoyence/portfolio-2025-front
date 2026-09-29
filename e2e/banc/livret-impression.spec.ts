import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
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

function pagesTassees(flux: readonly (readonly number[])[]): number {
  return flux.reduce((total, hauteurs) => {
    let pages = 1;
    let remplie = 0;
    for (const hauteur of hauteurs) {
      const suite = remplie + hauteur;
      if (suite > HAUTEUR_UTILE_PX && remplie > 0) {
        pages += 1;
        remplie = hauteur;
      } else {
        remplie = suite;
      }
    }
    return total + pages;
  }, 0);
}

function pagesDuPdf(pdf: Buffer): number {
  return pdf.toString('latin1').match(/\/Type\s*\/Page(?!\w)/g)?.length ?? 0;
}

async function vueImprimee(
  page: Page,
  { vue, pages }: { readonly vue: string; readonly pages: string } = VUES[0],
): Promise<Locator> {
  await ouvrirLeLivret(page);
  await page.getByTestId(`livret-vue-${vue}`).click();
  const ecrans = page.getByTestId(pages);
  await expect(ecrans.first()).toBeVisible();
  await page.setViewportSize({ width: LARGEUR_UTILE_PX, height: HAUTEUR_UTILE_PX });
  await page.emulateMedia({ media: 'print' });
  return ecrans;
}

test.describe(`Banc — livret papier du ${CODE_DU_COURS} imprimé en A4`, () => {
  for (const { vue, pages } of VUES) {
    test(`aucun écran du ${vue} n’est coupé entre deux pages A4`, async ({ page }, testInfo) => {
      const ecrans = await vueImprimee(page, { vue, pages });
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

  test('tasse plusieurs écrans par page A4, chaque feuille repartant sur une page neuve', async ({
    page,
  }) => {
    const ecrans = await vueImprimee(page);
    const flux = await page.getByTestId('livret-feuille').evaluateAll((feuilles) =>
      feuilles.map((feuille, rang) => {
        const entete = document.querySelector('.livret__entete');
        let bas =
          rang === 0 && entete !== null
            ? entete.getBoundingClientRect().top
            : feuille.getBoundingClientRect().top;
        return [...feuille.children].map((enfant) => {
          const { bottom } = enfant.getBoundingClientRect();
          const hauteur = Math.ceil(bottom - bas);
          bas = bottom;
          return hauteur;
        });
      }),
    );
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: false,
      preferCSSPageSize: true,
    });

    expect(pagesTassees(flux)).toBeLessThan(await ecrans.count());
    expect(pagesDuPdf(pdf)).toBeGreaterThanOrEqual(flux.length);
    expect(pagesDuPdf(pdf)).toBeLessThanOrEqual(pagesTassees(flux));
  });

  test('imprime chaque barre et chaque valeur des graphiques, sans attendre l animation', async ({
    page,
  }) => {
    await vueImprimee(page);
    const effaces = await page
      .locator('.slide-chart__bar, .slide-chart__value, .slide-chart__marqueur--barre')
      .evaluateAll((elements) =>
        elements
          .filter(
            (element) =>
              getComputedStyle(element).opacity !== '1' ||
              (element.classList.contains('slide-chart__bar') &&
                (getComputedStyle(element).transform !== 'none' ||
                  getComputedStyle(element).printColorAdjust !== 'exact')),
          )
          .map((element) => element.closest('[data-ecran]')?.getAttribute('data-ecran') ?? ''),
      );

    expect(effaces).toEqual([]);
  });
});
