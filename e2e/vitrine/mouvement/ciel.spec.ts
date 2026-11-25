import { expect, test, type Page, type Route } from '@playwright/test';
import { zPublishedArticleResponseDto } from '../../../contrat/zod.gen';
import { sommetsDuCiel } from '../../../src/app/shared/components/cadre/constellation/ciel/ciel';
import { ANNEAU } from '../../../src/app/shared/components/cadre/constellation/ciel/figures';
import { buildRecitDuMatin } from '../../../src/testing/factories/article.factory';
import { intercepterApi, servirJson, servirSansContenu } from '../../fixtures';
import { ouvrir } from '../ouvrir';
import {
  traverse,
  type Boite,
} from '../../../src/app/shared/components/cadre/constellation/formes';
import { TOILE_DE_FOND, opaciteAutour, placer, sansMouvement, surLaToile } from './toile';

const COUCHE_DE_LA_BANDE = '.cta canvas.couche-de-nuit';
const TEXTES_DE_LA_BANDE = '.cta .kicker, .cta .cta-title, .cta .cta-lead';

const boites = (elements: Element[]): Boite[] =>
  elements.map((element) => {
    const { left, top, width, height } = element.getBoundingClientRect();
    return { left, top, width, height };
  });
const ARTICLE = buildRecitDuMatin({ slug: 'recit-du-ciel' });
const ETOILES: Record<string, number> = {
  'Grande Ourse': 20,
  Lyre: 6,
  Cygne: 9,
  Cassiopée: 5,
  Persée: 23,
  Cocher: 9,
  Orion: 23,
  Lion: 9,
};

surLaToile();
sansMouvement();

const indexDe = (nom: string): number => ANNEAU.findIndex((figure) => figure.nom === nom);

const ecran = (page: Page): Boite => {
  const taille = page.viewportSize();
  if (!taille) throw new Error('écran sans taille');
  return { left: 0, top: 0, width: taille.width, height: taille.height };
};

const boiteDeLaBande = async (page: Page): Promise<Boite> => {
  const bande = await page.locator('.cta').first().boundingBox();
  if (!bande) throw new Error('bande sans boîte');
  return { left: bande.x, top: bande.y, width: bande.width, height: bande.height };
};

const etoilesAllumees = async (
  page: Page,
  toile: string,
  nom: string,
  boite: Boite,
): Promise<number> => {
  const textes =
    toile === COUCHE_DE_LA_BANDE ? await page.locator(TEXTES_DE_LA_BANDE).evaluateAll(boites) : [];
  let allumees = 0;
  for (const etoile of sommetsDuCiel(ANNEAU[indexDe(nom)], boite)) {
    const seuil = textes.some((texte) => traverse(etoile, etoile, texte)) ? 20 : 60;
    const { x, y } = etoile;
    if (y >= 0 && y < ecran(page).height && (await opaciteAutour(page, toile, x, y, 2)) >= seuil) {
      allumees += 1;
    }
  }
  return allumees;
};

async function exigerLaFigure(page: Page, toile: string, nom: string, boite: Boite) {
  expect(sommetsDuCiel(ANNEAU[indexDe(nom)], boite).length, nom).toBe(ETOILES[nom]);
  expect(await etoilesAllumees(page, toile, nom, boite), nom).toBe(ETOILES[nom]);
}

async function placerEtVoir(page: Page, selecteur: string, haut: number): Promise<void> {
  await placer(page, selecteur, haut);
  await page.clock.runFor(200);
}

const servirLArticle = (page: Page): Promise<void> =>
  intercepterApi(page, (route: Route, chemin: string) =>
    chemin.endsWith(`/articles/${ARTICLE.slug}`)
      ? servirJson(route, zPublishedArticleResponseDto, ARTICLE)
      : servirSansContenu(route),
  );

test('CIEL-01 · CIEL-02 · accueil : Cassiopée au chargement, Lion sur la FAQ, Grande Ourse dans la bande, sans l étoile à 12 branches', async ({
  page,
}) => {
  await ouvrir(page, '/');
  await page.clock.runFor(200);
  await exigerLaFigure(page, TOILE_DE_FOND, 'Cassiopée', ecran(page));

  await placerEtVoir(page, 'app-asili-faq section', 300);
  await exigerLaFigure(page, TOILE_DE_FOND, 'Lion', ecran(page));
  expect(await etoilesAllumees(page, TOILE_DE_FOND, 'Cassiopée', ecran(page))).toBeLessThan(5);

  await placerEtVoir(page, '.cta', 120);
  await exigerLaFigure(page, COUCHE_DE_LA_BANDE, 'Grande Ourse', await boiteDeLaBande(page));

  const bouton = await page.locator('.cta .btn-teal').first().boundingBox();
  if (!bouton) throw new Error('bouton sans boîte');
  const interieur = Math.hypot(bouton.width, bouton.height) / 2 + 16;
  let branches = 0;
  for (let index = 0; index < 12; index++) {
    const angle = -Math.PI / 2 + (index * Math.PI) / 6;
    const rayon = index % 2 === 0 ? interieur : interieur + 40;
    const x = bouton.x + bouton.width / 2 + rayon * Math.cos(angle);
    const y = bouton.y + bouton.height / 2 + rayon * Math.sin(angle);
    if ((await opaciteAutour(page, COUCHE_DE_LA_BANDE, x, y, 2)) >= 120) branches += 1;
  }
  expect(branches).toBeLessThan(3);
});

test('CIEL-01 · /offer à mi-page : le diagnostic au-dessus du milieu porte le Cocher', async ({
  page,
}) => {
  await ouvrir(page, '/offer');
  const sections = page.locator('main section:not(section section)');
  await expect(sections).toHaveCount(8);
  await placerEtVoir(page, 'main section:not(section section) >> nth=5', 300);

  await exigerLaFigure(page, TOILE_DE_FOND, 'Cocher', ecran(page));
});

for (const [chemin, nom] of [
  ['/', 'Grande Ourse'],
  ['/offer', 'Orion'],
  ['/projets', 'Cassiopée'],
  ['/presentation', 'Lyre'],
  ['/articles', 'Cygne'],
  [`/articles/${ARTICLE.slug}`, 'Persée'],
] as const) {
  test(`CIEL-02 · ${chemin} : la bande d appel porte ${nom}, en clair sur sa couche de nuit`, async ({
    page,
  }) => {
    await servirLArticle(page);
    await ouvrir(page, chemin);
    await placerEtVoir(page, '.cta', 120);

    await exigerLaFigure(page, COUCHE_DE_LA_BANDE, nom, await boiteDeLaBande(page));
  });
}

test.describe('mobile', () => {
  test.use({ viewport: { width: 412, height: 823 } });

  test('CIEL-03 · 412×823 : la Grande Ourse tient entière dans la bande, à la marge de son bord', async ({
    page,
  }) => {
    await ouvrir(page, '/');
    await placerEtVoir(page, '.cta', 60);
    const bande = await boiteDeLaBande(page);
    const marge = 0.1 * Math.min(bande.width, bande.height);

    for (const { x, y } of sommetsDuCiel(ANNEAU[indexDe('Grande Ourse')], bande)) {
      expect(x).toBeGreaterThanOrEqual(bande.left + marge - 0.01);
      expect(x).toBeLessThanOrEqual(bande.left + bande.width - marge + 0.01);
      expect(y).toBeGreaterThanOrEqual(bande.top + marge - 0.01);
      expect(y).toBeLessThanOrEqual(bande.top + bande.height - marge + 0.01);
    }
    await exigerLaFigure(page, COUCHE_DE_LA_BANDE, 'Grande Ourse', bande);
  });
});

test('CIEL-07 · /contact : le réseau est dessiné, aucune figure du ciel', async ({ page }) => {
  await ouvrir(page, '/contact');
  await page.clock.runFor(200);

  expect(
    await page.evaluate((selecteur) => {
      const toile = document.querySelector<HTMLCanvasElement>(selecteur);
      const donnees = toile?.getContext('2d')?.getImageData(0, 0, toile.width, toile.height).data;
      return donnees
        ? donnees.filter((_, index) => index % 4 === 3 && donnees[index] > 0).length
        : 0;
    }, TOILE_DE_FOND),
  ).toBeGreaterThan(0);
  for (const { nom, etoiles } of ANNEAU) {
    expect(await etoilesAllumees(page, TOILE_DE_FOND, nom, ecran(page)), nom).toBeLessThan(
      etoiles.length,
    );
  }
});

test('CIEL-07 · un redimensionnement garde la figure du héros, réajustée à la nouvelle boîte', async ({
  page,
}) => {
  await ouvrir(page, '/');
  await page.clock.runFor(200);
  await page.setViewportSize({ width: 412, height: 823 });
  await page.clock.runFor(200);

  await exigerLaFigure(page, TOILE_DE_FOND, 'Cassiopée', ecran(page));
});

test.describe('CIEL-07 · avec mouvement', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  test('CIEL-07 · avec mouvement, 1350×940 → 412×823 : Cassiopée entière dans la nouvelle boîte à l image suivante', async ({
    page,
  }) => {
    await ouvrir(page, '/');
    await page.clock.runFor(3000);
    await page.setViewportSize({ width: 412, height: 823 });
    await page.clock.runFor(17);

    await exigerLaFigure(page, TOILE_DE_FOND, 'Cassiopée', ecran(page));
  });

  test('CIEL-07 · avec mouvement, la bande défile de 40 px : la Grande Ourse la suit à l image suivante', async ({
    page,
  }) => {
    await ouvrir(page, '/');
    await placer(page, '.cta', 120);
    await page.clock.runFor(3000);
    await placer(page, '.cta', 80);
    await page.clock.runFor(17);

    await exigerLaFigure(page, COUCHE_DE_LA_BANDE, 'Grande Ourse', await boiteDeLaBande(page));
  });
});
