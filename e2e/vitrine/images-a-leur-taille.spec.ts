import { expect, test, type Page } from '@playwright/test';
import { ECRANS_DE_LIGHTHOUSE, sansContenu } from './ouvrir';

const SEUILS_DE_LIGHTHOUSE = { sansVariantes: 4096, avecVariantes: 12288 };

const ECRANS = [
  ...ECRANS_DE_LIGHTHOUSE,
  { nom: 'ordinateur rétina', viewport: { width: 1350, height: 940 }, deviceScaleFactor: 2 },
];

const gaspillages = (page: Page, selecteur: string): Promise<string[]> =>
  page.evaluate(
    async ({ seuils, selecteur }) => {
      const images = Array.from(document.querySelectorAll<HTMLImageElement>(selecteur)).filter(
        (image) => image.getClientRects().length > 0,
      );
      const ecarts: string[] = [];
      for (const image of images) {
        image.scrollIntoView({ block: 'center' });
        if (!image.complete) {
          await new Promise((suite) => image.addEventListener('load', suite, { once: true }));
        }
        const seuil = image.srcset === '' ? seuils.sansVariantes : seuils.avecVariantes;
        const boite = image.getBoundingClientRect();
        const affichee = boite.width * boite.height * devicePixelRatio ** 2;
        const naturelle = image.naturalWidth * image.naturalHeight;
        const ressource = performance
          .getEntriesByType('resource')
          .find((entree) => entree.name === image.currentSrc) as
          PerformanceResourceTiming | undefined;
        const octets = ressource?.encodedBodySize ?? 0;
        const gaspille = octets * Math.max(0, 1 - affichee / naturelle);
        if (octets === 0 || gaspille > seuil) {
          ecarts.push(
            `${image.currentSrc.split('/').pop()} ${image.naturalWidth}px pour ${Math.round(boite.width * devicePixelRatio)}px : ${Math.round(gaspille)} o gaspillés sur ${octets}`,
          );
        }
      }
      return ecarts;
    },
    { seuils: SEUILS_DE_LIGHTHOUSE, selecteur },
  );

for (const ecran of ECRANS) {
  test.describe(`REC-15 · une vignette ne télécharge pas plus que ce qu elle affiche (${ecran.nom})`, () => {
    test.use({ viewport: ecran.viewport, deviceScaleFactor: ecran.deviceScaleFactor });

    for (const chemin of ['/', '/projets']) {
      test(`REC-15 · ${chemin} en ${ecran.nom} : aucune vignette au-delà du gaspillage toléré par Lighthouse`, async ({
        page,
      }) => {
        await sansContenu(page);
        await page.goto(chemin);
        await expect(page.locator('.proj-shot img').first()).toBeAttached();

        expect(await gaspillages(page, '.proj-shot img')).toEqual([]);
      });
    }

    test(`REC-15 · / en ${ecran.nom} : le logo et la capture du héros restent sous le gaspillage toléré par Lighthouse`, async ({
      page,
    }) => {
      await sansContenu(page);
      await page.goto('/');
      await expect(page.locator('.hero-visuel img')).toBeVisible();

      expect(await gaspillages(page, '.asili-logo_img, .hero-visuel img')).toEqual([]);
    });
  });
}
