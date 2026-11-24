import { expect, test, type Locator } from '@playwright/test';
import { sansAnimationNiContenu } from './ouvrir';

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
