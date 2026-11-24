import { expect, test, type Page } from '@playwright/test';
import { baseAnglaise, exigerLaPorteSsr } from '../porte-ssr';
import { sansContenu } from '../vitrine/ouvrir';

const LANGUES = [
  { langue: 'fr', url: (chemin: string) => chemin },
  { langue: 'en', url: (chemin: string) => `${baseAnglaise}/en${chemin}` },
] as const;

const ouvrir = async (page: Page, langue: 'fr' | 'en', url: string): Promise<void> => {
  if (langue === 'en') exigerLaPorteSsr({ anglaise: true });
  await sansContenu(page);
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
};

const boite = async (page: Page, selecteur: string) => {
  const rectangle = await page.locator(selecteur).first().boundingBox();
  if (rectangle === null) throw new Error(`${selecteur} absent`);
  return rectangle;
};

const blocsHorsDuBord = (page: Page): Promise<string[]> =>
  page.evaluate(() => {
    const interieur = (element: Element) => {
      const cadre = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        gauche: Math.round(cadre.left + parseFloat(style.paddingLeft)),
        droite: Math.round(cadre.right - parseFloat(style.paddingRight)),
      };
    };
    const menu = interieur(document.querySelector('.asili-nav__inner') as Element);
    return Array.from(document.querySelectorAll('main .wrap, main .container, .cookie-banner > *'))
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => ({ nom: element.className.slice(0, 40), ...interieur(element) }))
      .filter(
        ({ gauche, droite }) =>
          Math.abs(gauche - menu.gauche) > 1 || Math.abs(droite - menu.droite) > 1,
      )
      .map(
        ({ nom, gauche, droite }) =>
          `${nom} ${gauche}→${droite}, menu ${menu.gauche}→${menu.droite}`,
      );
  });

const PAGES_DANS_LA_GRILLE = [
  '/',
  '/offer',
  '/projets',
  '/contact',
  '/growth-audit',
  '/presentation',
  '/formations',
  '/terms',
].flatMap((chemin) => [1440, 390].map((largeur) => ({ chemin, largeur })));

test.describe('VIT2-10 · chaque page tient dans la grille du menu', () => {
  for (const { chemin, largeur } of PAGES_DANS_LA_GRILLE) {
    test(`VIT2-10 · ${chemin} en ${largeur} px : contenu et bandeau cookies au bord du menu`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largeur, height: 900 });
      await ouvrir(page, 'fr', chemin);
      await expect(page.locator('.cookie-banner')).toBeVisible();

      expect(await blocsHorsDuBord(page)).toEqual([]);
    });
  }
});

for (const { langue, url } of LANGUES) {
  test.describe(`VIT2-03 · le pied de page est compact et centré (${langue})`, () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test(`VIT2-03 · en 1440 × 900, le pied tient dans l écran et s aligne sur le menu (${langue})`, async ({
      page,
    }) => {
      await ouvrir(page, langue, url('/'));
      const pied = await boite(page, 'footer.asili-footer');
      const contenu = await boite(page, '.asili-footer__inner');
      const menu = await boite(page, '.asili-nav__inner');

      expect(pied.height).toBeLessThanOrEqual(900);
      expect(Math.abs(contenu.x - menu.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(contenu.width - menu.width)).toBeLessThanOrEqual(1);
    });
  });

  for (const largeur of [1024, 1440]) {
    test(`VIT2-03 · en ${largeur} px, le champ et le bouton de la newsletter sont sur la même ligne (${langue})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largeur, height: 900 });
      await ouvrir(page, langue, url('/'));
      const champ = await boite(page, '.asili-footer__newsletter input[type="email"]');
      const bouton = await boite(page, '.asili-footer__newsletter button[type="submit"]');

      expect(Math.abs(champ.y - bouton.y)).toBeLessThanOrEqual(1);
    });

    test(`VIT2-04 · en ${largeur} px, le menu tient sur une ligne sans défilement horizontal (${langue})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largeur, height: 768 });
      await ouvrir(page, langue, url('/'));
      const boites = await page
        .locator('.asili-nav__inner .asili-nav__links > *')
        .evaluateAll((elements) =>
          elements
            .filter((element) => element.getClientRects().length > 0)
            .map((element) => element.getBoundingClientRect())
            .map(({ top, height }) => ({ centre: Math.round(top + height / 2), height })),
        );
      const hauteurs = boites.map(({ height }) => height);

      expect(new Set(boites.map(({ centre }) => centre)).size).toBe(1);
      expect(Math.max(...hauteurs) - Math.min(...hauteurs)).toBeLessThanOrEqual(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        largeur,
      );
    });
  }

  test(`VIT2-04 · à 360 × 640, le tiroir ouvert avec Formation dépliée ne déborde pas (${langue})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await ouvrir(page, langue, url('/'));
    await page.locator('button.asili-burger').click();
    await page.locator('.asili-drawer .asili-nav__trigger').click();
    await expect(page.locator('.asili-drawer__sublist')).toBeVisible();

    expect(
      await page
        .locator('.asili-drawer')
        .evaluate((tiroir) => tiroir.scrollWidth - tiroir.clientWidth),
    ).toBe(0);
  });
}
