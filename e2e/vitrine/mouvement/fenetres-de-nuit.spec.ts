import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from '../ouvrir';
import {
  TOILE_DE_FOND,
  defilerJusqua,
  exigerUnPointSurChaque,
  sansMouvement,
  surLaToile,
} from './toile';

const COUCHE_DE_LA_BANDE = '.cta canvas.couche-de-nuit';
const COUCHE_DE_LA_METHODE = '.ai-method canvas.couche-de-nuit';

surLaToile();

const fondDe = (page: Page, selecteur: string): Promise<string> =>
  page
    .locator(selecteur)
    .first()
    .evaluate((element) => getComputedStyle(element).backgroundColor);

test('CON-06 · le HTML servi de l accueil ne porte aucune toile', async ({ request }) => {
  const html = await (await request.get('/')).text();

  expect(html).not.toContain('<canvas');
});

test.describe('sans mouvement', () => {
  sansMouvement();

  test('CON-06 · aucune toile ne capte un clic, et une couche rendue cliquable reste sous le texte et le bouton', async ({
    page,
  }) => {
    const sousLeTexte = async (cibles: readonly string[]): Promise<void> => {
      for (const cible of cibles) {
        const element = page.locator(cible).first();
        await element.scrollIntoViewIfNeeded();
        await page.clock.runFor(100);
        const boite = await element.boundingBox();
        if (!boite) throw new Error(`${cible} sans boîte`);
        const atteint = await page.evaluate(
          ([selecteur, x, y]) => Boolean(document.elementFromPoint(x, y)?.closest(selecteur)),
          [cible, boite.x + boite.width / 2, boite.y + boite.height / 2] as const,
        );
        expect(atteint, cible).toBe(true);
      }
    };
    const rendreCliquable = () =>
      page.addStyleTag({
        content: 'app-couche-de-nuit, canvas.asili-field { pointer-events: auto !important; }',
      });

    await ouvrir(page, '/');
    await page.locator('.cta').first().scrollIntoViewIfNeeded();
    await page.clock.runFor(100);
    const pointage = await page.evaluate(() =>
      [...document.querySelectorAll('canvas')].map(
        (toile) => getComputedStyle(toile).pointerEvents,
      ),
    );
    expect(pointage).toEqual(['none', 'none']);
    await rendreCliquable();
    await sousLeTexte(['.cta .cta-title', '.cta .btn-teal']);

    await ouvrir(page, '/presentation');
    await rendreCliquable();
    await sousLeTexte(['.ai-method .ai-t', '.ai-method .ai-n']);
  });

  test('CON-06 · la bande d appel garde son fond sombre et porte sa couche de nuit', async ({
    page,
  }) => {
    await ouvrir(page, '/');
    await page.locator('.cta .btn-teal').first().scrollIntoViewIfNeeded();
    await page.clock.runFor(300);

    await expect(page.locator(COUCHE_DE_LA_BANDE)).toHaveCount(1);
    await expect(page.locator(COUCHE_DE_LA_BANDE)).toHaveAttribute('aria-hidden', 'true');
    expect(await fondDe(page, '.cta')).toBe('rgb(12, 9, 2)');
  });

  test('CON-06 · CON-05 · les étapes de /presentation se dessinent sur la couche de la fenêtre de nuit', async ({
    page,
  }) => {
    await ouvrir(page, '/presentation');
    await defilerJusqua(page, '.ai-steps');
    await page.clock.runFor(300);

    expect(await fondDe(page, '.ai-method')).toBe('rgb(10, 14, 18)');
    await exigerUnPointSurChaque(page, '.ai-method .ai-n', COUCHE_DE_LA_METHODE);
  });
});

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test.describe(`préférence de mouvement ${reducedMotion}`, () => {
    test.use({ contextOptions: { reducedMotion } });

    test('CON-08 · une couche dont la bande est hors de la fenêtre n est ni redimensionnée ni dessinée', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        const nettoyages = new WeakMap<object, number>();
        const nettoyer = CanvasRenderingContext2D.prototype.clearRect;
        Object.defineProperty(CanvasRenderingContext2D.prototype, 'clearRect', {
          value(this: CanvasRenderingContext2D, ...bornes: [number, number, number, number]) {
            nettoyages.set(this.canvas, (nettoyages.get(this.canvas) ?? 0) + 1);
            return nettoyer.apply(this, bornes);
          },
        });
        Object.assign(window, { nettoyages });
      });
      const etatDeLaCouche = () =>
        page.evaluate((selecteur) => {
          const couche = document.querySelector<HTMLCanvasElement>(selecteur);
          if (!couche) return null;
          const nettoyages = Reflect.get(window, 'nettoyages') as WeakMap<object, number>;
          return {
            dessins: nettoyages.get(couche) ?? 0,
            largeur: couche.width,
            hauteur: couche.height,
          };
        }, COUCHE_DE_LA_BANDE);

      await ouvrir(page, '/');
      await page.clock.runFor(500);
      await page.mouse.wheel(0, 1);
      await page.clock.runFor(100);
      expect(await etatDeLaCouche()).toEqual({ dessins: 0, largeur: 300, hauteur: 150 });

      await page.locator('.cta .btn-teal').first().scrollIntoViewIfNeeded();
      await page.clock.runFor(300);
      const bande = await page.locator('.cta').first().boundingBox();
      const etat = await etatDeLaCouche();
      expect(etat?.dessins).toBeGreaterThanOrEqual(1);
      expect(etat?.largeur).toBe(Math.round(bande?.width ?? 0));
    });
  });
}

test('CON-01 · une navigation garde la même toile de fond', async ({ page }) => {
  await ouvrir(page, '/');
  await page.evaluate((selecteur) => {
    Object.assign(window, { toileDeDepart: document.querySelector(selecteur) });
  }, TOILE_DE_FOND);

  await page.locator('a[href="/offer"]').first().click();
  await expect(page).toHaveURL(/\/offer$/);

  expect(
    await page.evaluate(
      (selecteur) => document.querySelector(selecteur) === Reflect.get(window, 'toileDeDepart'),
      TOILE_DE_FOND,
    ),
  ).toBe(true);
});
