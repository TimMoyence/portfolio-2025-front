import { expect, test, type Page } from '@playwright/test';
import { ouvrir, sansAnimationNiContenu, sansContenu } from './ouvrir';

const PAGES_A_HEROS = ['/', '/offer', '/projets', '/presentation', '/articles', '/contact'];

interface EtatDuTitre {
  readonly texte: string;
  readonly animations: number;
  readonly ecarts: readonly string[];
}

const relever = (page: Page): Promise<EtatDuTitre> =>
  page.evaluate(() => {
    const titre = document.querySelector('h1') as HTMLElement;
    const ecarts: string[] = [];
    let opacite = 1;
    for (let e: Element | null = titre; e !== null; e = e.parentElement) {
      opacite *= Number(getComputedStyle(e).opacity);
    }
    if (opacite < 1) ecarts.push(`opacité ${opacite}`);
    const boite = titre.getBoundingClientRect();
    for (let e = titre.parentElement; e !== null; e = e.parentElement) {
      const style = getComputedStyle(e);
      const rogne =
        style.overflowX !== 'visible' || style.overflowY !== 'visible' || style.clipPath !== 'none';
      if (!rogne || e === document.body || e === document.documentElement) continue;
      const cadre = e.getBoundingClientRect();
      const dedans =
        boite.top >= cadre.top - 0.5 &&
        boite.bottom <= cadre.bottom + 0.5 &&
        boite.left >= cadre.left - 0.5 &&
        boite.right <= cadre.right + 0.5;
      if (!dedans) ecarts.push(`rogné par ${e.className}`);
    }
    if (titre.scrollWidth > titre.clientWidth + 1) ecarts.push('déborde en largeur');
    return {
      texte: (titre.textContent ?? '').trim(),
      animations: titre.getAnimations({ subtree: true }).length,
      ecarts,
    };
  });

const TITRE_IMMOBILE = { animations: 0, ecarts: [], mots: 0, vide: false };

const titreServi = async (page: Page, chemin: string) => {
  await ouvrir(page, chemin);
  const { texte, animations, ecarts } = await relever(page);
  return { animations, ecarts, mots: await page.locator('h1 .mot').count(), vide: texte === '' };
};

const textesAnimesHorsTitre = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    document
      .getAnimations()
      .map((animation) => animation.effect as KeyframeEffect | null)
      .filter((effet) => effet?.pseudoElement === null)
      .map((effet) => effet?.target)
      .filter((cible): cible is Element => cible instanceof Element)
      .filter((cible) => (cible.textContent ?? '').trim() !== '')
      .map((cible) => `${cible.tagName.toLowerCase()}.${cible.className}`.slice(0, 60)),
  );

const etatDesFilets = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('main .section-pad')).map((section) => {
      const filet = getComputedStyle(section, '::before');
      return `${filet.content} ${filet.height} ${filet.transform}`;
    }),
  );

const FILET_TRACE = /^"" 1px (none|matrix\(1, 0, 0, 1, 0, 0\))$/;

test.describe('REC-17 · trois signatures de mouvement qui ne cachent rien', () => {
  test.beforeEach(async ({ page }) => {
    await sansContenu(page);
  });

  for (const chemin of PAGES_A_HEROS) {
    test(`VIT2-06 · ${chemin} : le titre arrive immobile, visible et entier`, async ({ page }) => {
      expect(await titreServi(page, chemin)).toEqual(TITRE_IMMOBILE);
    });
  }

  test('REC-17 · aucun autre texte ne bouge à l entrée de l accueil', async ({ page }) => {
    await ouvrir(page, '/');

    expect(await textesAnimesHorsTitre(page)).toEqual([]);
  });

  test('REC-17 · le filet se trace à l entrée de la section, une seule fois', async ({ page }) => {
    await ouvrir(page, '/');
    const derniere = page.locator('main .section-pad').last();

    expect((await etatDesFilets(page)).at(-1)).toMatch(/^"" 1px matrix\(0, 0, 0, 1, 0, 0\)$/);

    await derniere.scrollIntoViewIfNeeded();
    await expect(derniere).toHaveClass(/filet-trace/);
    await expect.poll(async () => (await etatDesFilets(page)).at(-1)).toMatch(FILET_TRACE);

    await page.evaluate(() => window.scrollTo(0, 0));
    await derniere.scrollIntoViewIfNeeded();
    expect(
      await derniere.evaluate((section) =>
        section
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === 'running'),
      ),
    ).toHaveLength(0);
    expect((await etatDesFilets(page)).at(-1)).toMatch(FILET_TRACE);
  });

  test('REC-17 · au survol, la capture défile ; en fin de survol, elle remonte', async ({
    page,
  }) => {
    await page.goto('/projets');
    const capture = page.locator('.proj-shot img').first();
    await capture.scrollIntoViewIfNeeded();
    const position = () => capture.evaluate((image) => getComputedStyle(image).objectPosition);

    expect(await position()).toBe('50% 0%');

    await capture.hover();
    await expect.poll(position).toBe('50% 100%');

    await page.mouse.move(0, 0);
    await expect.poll(position).toBe('50% 0%');
  });
});

test.describe('REC-17 · sous « réduire les animations », tout est dans son état final', () => {
  sansAnimationNiContenu();

  for (const chemin of ['/', '/offer', '/projets']) {
    test(`VIT2-05 · ${chemin} : titre complet immobile, filets tracés, aucune animation`, async ({
      page,
    }) => {
      await ouvrir(page, chemin);

      expect(
        await page.evaluate(() =>
          document
            .getAnimations()
            .map((animation) => (animation.effect as KeyframeEffect | null)?.target)
            .map((cible) => (cible instanceof Element ? cible.className : '')),
        ),
      ).toEqual([]);
      const filets = await etatDesFilets(page);
      expect(filets.length).toBeGreaterThan(0);
      for (const filet of filets) expect(filet).toMatch(FILET_TRACE);
    });
  }

  test('REC-17 · la capture reste immobile sur son haut au survol', async ({ page }) => {
    await page.goto('/projets');
    const capture = page.locator('.proj-shot img').first();
    await capture.hover();

    expect(await capture.evaluate((image) => getComputedStyle(image).objectPosition)).toBe(
      '50% 0%',
    );
    expect(await capture.evaluate((image) => image.getAnimations().length)).toBe(0);
    expect(
      await page
        .locator('.proj')
        .first()
        .evaluate((carte) => carte.getAnimations({ subtree: true }).length),
    ).toBe(0);
  });

  test('REC-17 · d une vignette à sa fiche, aucune View Transition ne joue', async ({ page }) => {
    await page.addInitScript(() => {
      const sautees: boolean[] = [];
      Object.assign(window, { transitionsSautees: sautees });
      const origine = document.startViewTransition?.bind(document);
      if (origine === undefined) return;
      document.startViewTransition = (rappel) => {
        const transition = origine(rappel);
        transition.ready.then(
          () => sautees.push(false),
          () => sautees.push(true),
        );
        return transition;
      };
    });
    await page.goto('/projets');
    await page.locator('.proj-link').first().click();
    await expect(page).toHaveURL(/\/projets\/[a-z-]+$/);

    const sautees = await page.evaluate(
      () => (window as unknown as { transitionsSautees: boolean[] }).transitionsSautees,
    );
    expect(sautees.length).toBeGreaterThan(0);
    expect(sautees.every(Boolean)).toBe(true);
  });
});

test.describe('VIT2-06 · sur un téléphone de 390 px, aucun titre n est rogné', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const chemin of PAGES_A_HEROS) {
    test(`VIT2-06 · ${chemin} en 390 px : le titre est visible et entier`, async ({ page }) => {
      await sansContenu(page);

      expect(await titreServi(page, chemin)).toEqual(TITRE_IMMOBILE);
    });
  }
});

const ecartsDesFilets = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('main .section-pad')).flatMap((section) => {
      const contenu = section.querySelector<HTMLElement>(':scope > .wrap, :scope .wrap');
      if (contenu === null) return [];
      const filet = getComputedStyle(section, '::before');
      const cadre = section.getBoundingClientRect();
      const gauche = cadre.left + parseFloat(filet.left);
      const droite = cadre.right - parseFloat(filet.right);
      const boite = contenu.getBoundingClientRect();
      const style = getComputedStyle(contenu);
      const attendueGauche = boite.left + parseFloat(style.paddingLeft);
      const attendueDroite = boite.right - parseFloat(style.paddingRight);
      return Math.abs(gauche - attendueGauche) <= 1 && Math.abs(droite - attendueDroite) <= 1
        ? []
        : [
            `${section.className.slice(0, 30)} filet ${Math.round(gauche)}→${Math.round(droite)}, contenu ${Math.round(attendueGauche)}→${Math.round(attendueDroite)}`,
          ];
    }),
  );

for (const largeur of [1440, 390]) {
  test.describe(`VIT2-10 · en ${largeur} px, chaque filet de section couvre la largeur du contenu`, () => {
    test.use({ viewport: { width: largeur, height: 900 } });

    for (const chemin of ['/', '/offer', '/projets', '/presentation']) {
      test(`VIT2-10 · ${chemin} en ${largeur} px : filets au bord du contenu`, async ({ page }) => {
        await sansContenu(page);
        await ouvrir(page, chemin);

        expect(await ecartsDesFilets(page)).toEqual([]);
      });
    }
  });
}

const grilleDuPlan = (page: Page) =>
  page.locator('app-asili-method .method-steps').evaluate((grille) => ({
    colonnes: getComputedStyle(grille).gridTemplateColumns.split(' ').length,
    etapes: grille.querySelectorAll('.step').length,
    livrables: grille.querySelectorAll('.step .livrable').length,
  }));

test.describe('VIT2-10 · le plan prend autant de colonnes que d étapes', () => {
  test('VIT2-10 · accueil en 1440 px : cinq colonnes pour cinq phases, chacune avec son livrable', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await sansContenu(page);
    await ouvrir(page, '/');

    expect(await grilleDuPlan(page)).toEqual({ colonnes: 5, etapes: 5, livrables: 5 });
  });

  test('VIT2-10 · /projets en 1440 px : quatre colonnes, sans livrable', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await sansContenu(page);
    await ouvrir(page, '/projets');

    expect(await grilleDuPlan(page)).toEqual({ colonnes: 4, etapes: 4, livrables: 0 });
  });

  test('VIT2-10 · accueil en 390 px : une colonne, sans défilement horizontal', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await sansContenu(page);
    await ouvrir(page, '/');

    expect((await grilleDuPlan(page)).colonnes).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  });
});

test.describe('VIT2-07 · toute la carte survolée mène à sa page', () => {
  for (const { chemin, carte, texte } of [
    { chemin: '/', carte: '.proj', texte: 'h3' },
    { chemin: '/offer', carte: '.apercu .proj', texte: 'h3' },
    { chemin: '/projets', carte: '.proj', texte: '.proj-body p' },
    { chemin: '/formations', carte: '.formation', texte: 'h3' },
  ]) {
    test(`VIT2-07 · ${chemin} : un clic sur ${carte} ${texte} ouvre sa page`, async ({ page }) => {
      await sansContenu(page);
      await ouvrir(page, chemin);
      const premiere = page.locator(carte).first();
      const destination = await premiere.locator('a').first().getAttribute('href');
      const cible = premiere.locator(texte).first();
      await cible.scrollIntoViewIfNeeded();
      const boite = await cible.boundingBox();
      if (boite === null || destination === null) throw new Error(`${carte} ${texte} absent`);
      await page.mouse.click(boite.x + boite.width / 2, boite.y + boite.height / 2);

      await expect(page).toHaveURL(new RegExp(`${destination.split('/').at(-1)}$`));
    });
  }
});

test.describe('REC-16 · sur une tablette tactile, l appui sur une carte navigue', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 820, height: 1180 } });

  test('REC-16 · appui sur une vignette : la fiche s ouvre, la capture ne défile pas', async ({
    page,
  }) => {
    await sansContenu(page);
    await page.goto('/projets');
    const capture = page.locator('.proj-shot img').first();
    await capture.scrollIntoViewIfNeeded();

    expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(false);
    await capture.tap();

    await expect(page).toHaveURL(/\/projets\/[a-z-]+$/);
  });
});
