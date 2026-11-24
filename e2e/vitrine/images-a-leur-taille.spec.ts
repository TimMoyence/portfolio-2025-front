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

    for (const { titre, chemin, attendue, etat, mesurees } of [
      ...['/', '/projets'].map((chemin) => ({
        titre: `REC-15 · ${chemin} en ${ecran.nom} : aucune vignette au-delà du gaspillage toléré par Lighthouse`,
        chemin,
        attendue: '.proj-shot img',
        etat: 'attached' as const,
        mesurees: '.proj-shot img',
      })),
      ...[
        { chemin: '/', visuels: '.hero-visuel img, .guide app-portrait img' },
        { chemin: '/offer', visuels: '.hero-visuel img' },
        { chemin: '/contact', visuels: '.hero-visuel img' },
        { chemin: '/presentation', visuels: 'app-portrait img' },
      ].map(({ chemin, visuels }) => ({
        titre: `VIT2-10 · ${chemin} en ${ecran.nom} : le logo, l illustration et le portrait restent sous le gaspillage toléré par Lighthouse`,
        chemin,
        attendue: visuels,
        etat: 'visible' as const,
        mesurees: `.asili-logo_img, ${visuels}`,
      })),
    ]) {
      test(titre, async ({ page }) => {
        await sansContenu(page);
        await page.goto(chemin);
        await page.locator(attendue).first().waitFor({ state: etat });

        expect(await gaspillages(page, mesurees)).toEqual([]);
      });
    }
  });
}
