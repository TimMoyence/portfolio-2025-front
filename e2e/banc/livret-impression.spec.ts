import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import {
  HAUTEUR_UTILE_PX,
  hauteurDePageA,
  hauteursDesEcrans,
  LARGEUR_UTILE_PX,
  MARGE_PX,
} from '../impression-a4';
import { CODE_DU_COURS, ouvrirLeLivret } from './contexte';

const VUES = [
  { vue: 'sujet', pages: 'livret-ecran' },
  { vue: 'corrige', pages: 'livret-corrige' },
] as const;

interface FicheMesuree {
  readonly hauteurs: readonly number[];
  readonly aLaSuite: boolean;
}

function pagesTassees(flux: readonly FicheMesuree[], hauteurDePage: number): number {
  let pages = 0;
  let remplie = 0;
  for (const { hauteurs, aLaSuite } of flux) {
    if (!aLaSuite || pages === 0) {
      pages += 1;
      remplie = 0;
    }
    for (const hauteur of hauteurs) {
      const suite = remplie + hauteur;
      if (suite > hauteurDePage && remplie > 0) {
        pages += 1;
        remplie = hauteur;
      } else {
        remplie = suite;
      }
    }
  }
  return pages;
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

async function hauteurDePageImprimee(page: Page): Promise<number> {
  const largeur = await page
    .locator('.livret')
    .evaluate((livret) => livret.getBoundingClientRect().width);
  return hauteurDePageA(largeur);
}

test.describe(`Banc — livret papier du ${CODE_DU_COURS} imprimé en A4`, () => {
  for (const { vue, pages } of VUES) {
    test(`aucun écran du ${vue} n’est coupé entre deux pages A4`, async ({ page }, testInfo) => {
      const ecrans = await vueImprimee(page, { vue, pages });
      const hauteurDePage = await hauteurDePageImprimee(page);
      const mesures = await hauteursDesEcrans(ecrans);
      const pdf = await page.pdf({
        path: testInfo.outputPath(`livret-${vue}.pdf`),
        format: 'A4',
        printBackground: false,
        margin: {
          top: `${MARGE_PX}px`,
          bottom: `${MARGE_PX}px`,
          left: `${MARGE_PX}px`,
          right: `${MARGE_PX}px`,
        },
      });
      await testInfo.attach(`livret-${vue}.pdf`, { body: pdf, contentType: 'application/pdf' });

      expect(mesures.length).toBeGreaterThan(0);
      expect(hauteurDePage).toBeGreaterThan(HAUTEUR_UTILE_PX);
      expect(mesures.filter(({ hauteur }) => hauteur > hauteurDePage)).toEqual([]);
    });
  }

  test('tasse plusieurs écrans par page A4, chaque fiche repartant sur une page neuve sauf celles imprimées à la suite', async ({
    page,
  }) => {
    const ecrans = await vueImprimee(page);
    const hauteurDePage = await hauteurDePageImprimee(page);
    const flux = await page.getByTestId('livret-feuille').evaluateAll((feuilles) =>
      feuilles.map((feuille, rang) => {
        const entete = document.querySelector('.livret__entete');
        let bas =
          rang === 0 && entete !== null
            ? entete.getBoundingClientRect().top
            : feuille.getBoundingClientRect().top;
        return {
          aLaSuite: feuille.classList.contains('livret__feuille--a-la-suite'),
          hauteurs: [...feuille.children].map((enfant) => {
            const { bottom } = enfant.getBoundingClientRect();
            const hauteur = Math.ceil(bottom - bas);
            bas = bottom;
            return hauteur;
          }),
        };
      }),
    );
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: false,
      preferCSSPageSize: true,
    });

    expect(pagesTassees(flux, hauteurDePage)).toBeLessThan(await ecrans.count());
    expect(pagesDuPdf(pdf)).toBeGreaterThanOrEqual(flux.filter(({ aLaSuite }) => !aLaSuite).length);
    expect(pagesDuPdf(pdf)).toBeLessThanOrEqual(pagesTassees(flux, hauteurDePage));
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
