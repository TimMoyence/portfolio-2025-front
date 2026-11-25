import { expect, test, type Locator, type Page } from '@playwright/test';
import { ouvrir, sansContenu } from './ouvrir';

interface Boite {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly width: number;
}

interface Carte {
  readonly grille: Boite;
  readonly carte: Boite;
  readonly capture: Boite;
  readonly texte: Boite;
  readonly interieur: number;
  readonly image: string;
}

const GOUTTIERES = 44;

const mesurer = (carte: Locator): Promise<Carte> =>
  carte.evaluate(async (element) => {
    const image = element.querySelector<HTMLImageElement>('.proj-shot img');
    if (!image) throw new Error('carte sans image');
    image.scrollIntoView({ block: 'center' });
    if (!image.complete) {
      await new Promise((suite) => image.addEventListener('load', suite, { once: true }));
    }
    const boite = (cible: Element | null): Boite => {
      if (!cible) throw new Error('élément de carte absent');
      const { left, right, top, bottom, width } = cible.getBoundingClientRect();
      return { left, right, top, bottom, width };
    };
    return {
      grille: boite(element.closest('.proj-grid')),
      carte: boite(element),
      capture: boite(element.querySelector('.proj-shot')),
      texte: boite(element.querySelector('.proj-body')),
      interieur: element.clientWidth,
      image: image.currentSrc.split('/').pop() ?? '',
    };
  });

const carteDe = (page: Page, titre: string): Locator =>
  page.locator('.proj').filter({ has: page.getByRole('heading', { name: titre, exact: true }) });

const enLarge = ({ grille, carte, capture, texte, interieur, image }: Carte) => ({
  pleineRangee: Math.abs(carte.width - grille.width) <= 1,
  captureMoitie: Math.abs(capture.width - interieur / 2) <= 1,
  texteADroite: texte.left >= capture.right - 1,
  image,
});

const unTiers = ({ grille }: Carte): number => Math.round((grille.width - GOUTTIERES) / 3);

async function ouvrirLesRealisations(page: Page, largeur: number, hauteur = 900): Promise<void> {
  await sansContenu(page);
  await page.setViewportSize({ width: largeur, height: hauteur });
  await ouvrir(page, '/projets');
}

test.describe('PROJ-01 · une famille d une seule réalisation s étend sur toute la rangée', () => {
  test('PROJ-01 · à 1440 px, Musaium occupe la grille : capture à gauche sur la moitié, texte à droite, image de 640', async ({
    page,
  }) => {
    await ouvrirLesRealisations(page, 1440);
    expect(enLarge(await mesurer(carteDe(page, 'Musaium')))).toEqual({
      pleineRangee: true,
      captureMoitie: true,
      texteADroite: true,
      image: '640.webp',
    });
  });

  test('PROJ-01 · à 861 px la carte seule reste en large, image de 400 ; à 860 px elle redevient verticale', async ({
    page,
  }) => {
    await ouvrirLesRealisations(page, 861);
    const large = await mesurer(carteDe(page, 'Musaium'));

    await page.setViewportSize({ width: 860, height: 900 });
    const verticale = await mesurer(carteDe(page, 'Musaium'));

    expect(enLarge(large)).toEqual({
      pleineRangee: true,
      captureMoitie: true,
      texteADroite: true,
      image: '400.webp',
    });
    expect(Math.round(verticale.capture.width)).toBe(verticale.interieur);
    expect(verticale.texte.top).toBeGreaterThanOrEqual(verticale.capture.bottom - 1);
  });

  test('PROJ-01 · à 412 px la capture de Musaium est au-dessus du texte, pleine largeur', async ({
    page,
  }) => {
    await ouvrirLesRealisations(page, 412, 823);
    const musaium = await mesurer(carteDe(page, 'Musaium'));

    expect(Math.round(musaium.capture.width)).toBe(musaium.interieur);
    expect(musaium.texte.top).toBeGreaterThanOrEqual(musaium.capture.bottom - 1);
  });

  test('PROJ-01 · une famille de plusieurs cartes garde ses tiers, carte orpheline d Outils comprise', async ({
    page,
  }) => {
    await ouvrirLesRealisations(page, 1440);
    const atlanticBike = await mesurer(carteDe(page, 'AtlanticBike'));
    const fourmizzz = await mesurer(carteDe(page, 'Fourmizzz-Suite'));

    expect(Math.round(atlanticBike.carte.width)).toBe(unTiers(atlanticBike));
    expect(Math.round(fourmizzz.carte.width)).toBe(unTiers(fourmizzz));
    expect(fourmizzz.texte.top).toBeGreaterThanOrEqual(fourmizzz.capture.bottom - 1);
  });

  for (const chemin of ['/', '/offer']) {
    test(`PROJ-01 · ${chemin} à 1440 px : toutes les cartes au tiers, aucune en large`, async ({
      page,
    }) => {
      await sansContenu(page);
      await page.setViewportSize({ width: 1440, height: 900 });
      await ouvrir(page, chemin);
      const cartes = page.locator('.proj');
      await expect(cartes.first()).toBeVisible();

      const largeurs = await cartes.evaluateAll((elements) =>
        elements.map((carte) => {
          const grille = carte.closest('.proj-grid')?.getBoundingClientRect().width ?? 0;
          return Math.round(carte.getBoundingClientRect().width - (grille - 44) / 3);
        }),
      );

      expect(largeurs.length).toBeGreaterThan(0);
      expect(largeurs.filter((ecart) => ecart !== 0)).toEqual([]);
    });
  }
});

test.describe('PROJ-01 · la carte large télécharge l image de sa largeur', () => {
  for (const { densite, attendue } of [
    { densite: 1, attendue: '640.webp' },
    { densite: 2, attendue: '1200.webp' },
  ]) {
    test(`PROJ-01 · à 1350 px en densité ${densite}, Musaium charge ${attendue}`, async ({
      browser,
    }) => {
      const contexte = await browser.newContext({
        viewport: { width: 1350, height: 940 },
        deviceScaleFactor: densite,
      });
      const page = await contexte.newPage();
      await sansContenu(page);
      await ouvrir(page, '/projets');

      expect((await mesurer(carteDe(page, 'Musaium'))).image).toBe(attendue);
      await contexte.close();
    });
  }
});
