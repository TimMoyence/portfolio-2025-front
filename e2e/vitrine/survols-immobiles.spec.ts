import { expect, test, type Locator } from '@playwright/test';
import { sansAnimationNiContenu, sansContenu } from './ouvrir';

const SURVOLS = [
  { chemin: '/', selecteur: 'main .btn' },
  { chemin: '/', selecteur: '.step' },
  { chemin: '/projets', selecteur: '.step' },
  { chemin: '/projets', selecteur: '.proj' },
  { chemin: '/offer', selecteur: '.diagnostic' },
  { chemin: '/presentation', selecteur: '.skill' },
  { chemin: '/presentation', selecteur: '.ai-step' },
  { chemin: '/formations', selecteur: '.formation' },
];

interface Mouvement {
  readonly animations: number;
  readonly transforms: readonly string[];
}

const mouvement = (cible: Locator): Promise<Mouvement> =>
  cible.evaluate(async (element) => {
    await new Promise((suite) => requestAnimationFrame(() => suite(null)));
    return {
      animations: element.getAnimations({ subtree: true }).length,
      transforms: [element, ...Array.from(element.querySelectorAll('*'))].map(
        (noeud) => getComputedStyle(noeud).transform,
      ),
    };
  });

const CARTES = [
  { chemin: '/', selecteur: '.step' },
  { chemin: '/', selecteur: '.proj' },
  { chemin: '/offer', selecteur: '.step' },
  { chemin: '/offer', selecteur: '.apercu .proj' },
  { chemin: '/projets', selecteur: '.proj' },
];

const hautsAuRepos = async (cible: Locator): Promise<number[]> => {
  await expect
    .poll(() =>
      cible.evaluate(
        (element) =>
          [...document.getAnimations(), ...element.getAnimations({ subtree: true })].filter(
            (animation) => animation.playState === 'running',
          ).length,
      ),
    )
    .toBe(0);
  return cible.evaluate((element) =>
    [element, ...Array.from(element.querySelectorAll('*'))].map((noeud) =>
      Math.round(noeud.getBoundingClientRect().top),
    ),
  );
};

test.describe('VIT2-05 · animations permises, aucune carte de la vitrine ne se soulève au survol ni au clic', () => {
  test.beforeEach(async ({ page }) => {
    await sansContenu(page);
  });

  for (const { chemin, selecteur } of CARTES) {
    test(`VIT2-05 · ${chemin} ${selecteur} : rien ne monte`, async ({ page }) => {
      await page.goto(chemin);
      const cible = page.locator(selecteur).first();
      await cible.scrollIntoViewIfNeeded();
      const repos = await hautsAuRepos(cible);

      await cible.hover();
      const survol = await hautsAuRepos(cible);
      await page.mouse.down();
      const enfonce = await hautsAuRepos(cible);
      await page.mouse.move(0, 0);
      await page.mouse.up();

      expect(
        await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
      ).toBe(false);
      expect({ survol, enfonce }).toEqual({ survol: repos, enfonce: repos });
    });
  }
});

test.describe('REC-17 · sous « réduire les animations », aucun survol de la vitrine ne déplace ni n anime', () => {
  sansAnimationNiContenu();

  for (const { chemin, selecteur } of SURVOLS) {
    test(`REC-17 · ${chemin} ${selecteur} : rien ne bouge au survol`, async ({ page }) => {
      await page.goto(chemin);
      const cible = page.locator(selecteur).first();
      await cible.scrollIntoViewIfNeeded();
      const repos = await mouvement(cible);

      await cible.hover();

      expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(true);
      expect(await mouvement(cible)).toEqual({ animations: 0, transforms: repos.transforms });
    });
  }
});
