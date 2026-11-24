import { expect, test, type Page } from '@playwright/test';
import { ouvrir, sansAnimationNiContenu, sansContenu } from './ouvrir';

const PAGES_A_HEROS = ['/', '/offer', '/projets', '/presentation', '/articles'];

interface EtatDesMots {
  readonly mots: readonly string[];
  readonly texteDuTitre: readonly string[];
  readonly animes: number;
  readonly ecarts: readonly string[];
}

const relever = (page: Page): Promise<EtatDesMots> =>
  page.evaluate(async () => {
    const titre = document.querySelector('h1');
    const mots = Array.from(titre?.querySelectorAll<HTMLElement>('.mot') ?? []);
    const ecarts: string[] = [];
    const opacite = (element: Element): number => {
      let produit = 1;
      for (let e: Element | null = element; e !== null; e = e.parentElement) {
        produit *= Number(getComputedStyle(e).opacity);
      }
      return produit;
    };
    const verifier = (instant: string): void => {
      for (const mot of mots) {
        if (opacite(mot) < 1)
          ecarts.push(`${instant} « ${mot.textContent} » opacité ${opacite(mot)}`);
        const boite = mot.getBoundingClientRect();
        for (let e = mot.parentElement; e !== null; e = e.parentElement) {
          const style = getComputedStyle(e);
          const rogne =
            style.overflowX !== 'visible' ||
            style.overflowY !== 'visible' ||
            style.clipPath !== 'none';
          if (!rogne || e === document.body || e === document.documentElement) continue;
          const cadre = e.getBoundingClientRect();
          const dedans =
            boite.top >= cadre.top - 0.5 &&
            boite.bottom <= cadre.bottom + 0.5 &&
            boite.left >= cadre.left - 0.5 &&
            boite.right <= cadre.right + 0.5;
          if (!dedans) ecarts.push(`${instant} « ${mot.textContent} » rogné par ${e.className}`);
        }
      }
    };
    const animations = mots.flatMap((mot) => mot.getAnimations());
    animations.forEach((animation) => animation.pause());
    const fin = Math.max(
      0,
      ...animations.map((animation) => Number(animation.effect?.getComputedTiming().endTime ?? 0)),
    );
    for (const part of [0, 0.25, 0.5, 0.75, 1]) {
      animations.forEach((animation) => {
        animation.currentTime = fin * part;
      });
      await new Promise((suite) => requestAnimationFrame(() => suite(null)));
      verifier(`t=${Math.round(fin * part)}ms`);
    }
    animations.forEach((animation) => animation.finish());
    return {
      mots: mots.map((mot) => mot.textContent ?? ''),
      texteDuTitre: (titre?.textContent ?? '').split(/\s+/).filter(Boolean),
      animes: animations.filter(
        (animation) =>
          animation.effect?.getTiming().iterations === 1 &&
          (animation.effect as KeyframeEffect).getKeyframes().some((cle) => 'transform' in cle) &&
          (animation.effect as KeyframeEffect).getKeyframes().every((cle) => !('opacity' in cle)),
      ).length,
      ecarts,
    };
  });

const titreEntier = async (page: Page, chemin: string): Promise<EtatDesMots> => {
  await ouvrir(page, chemin);
  const etat = await relever(page);
  expect(etat.mots).toEqual(etat.texteDuTitre);
  expect(etat.ecarts).toEqual([]);
  return etat;
};

const textesAnimesHorsTitre = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    document
      .getAnimations()
      .map((animation) => animation.effect as KeyframeEffect | null)
      .filter((effet) => effet?.pseudoElement === null)
      .map((effet) => effet?.target)
      .filter((cible): cible is Element => cible instanceof Element)
      .filter((cible) => !cible.classList.contains('mot'))
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
    test(`REC-17 · ${chemin} : le titre s ouvre mot par mot, chaque mot visible et entier`, async ({
      page,
    }) => {
      const etat = await titreEntier(page, chemin);

      expect(etat.animes).toBe(etat.mots.length);
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

  test('REC-17 · titre complet immobile, filets tracés, aucune animation', async ({ page }) => {
    await ouvrir(page, '/');

    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    const filets = await etatDesFilets(page);
    expect(filets.length).toBeGreaterThan(0);
    for (const filet of filets) expect(filet).toMatch(FILET_TRACE);
  });

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

test.describe('REC-17 · sur un téléphone de 390 px, aucun mot du titre n est rogné', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const chemin of PAGES_A_HEROS) {
    test(`REC-17 · ${chemin} en 390 px : chaque mot visible et entier`, async ({ page }) => {
      await sansContenu(page);
      const etat = await titreEntier(page, chemin);

      expect(etat.mots.length).toBeGreaterThan(0);
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
