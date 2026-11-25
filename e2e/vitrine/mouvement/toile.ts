import { expect, test, type Page } from '@playwright/test';
import { sommetsDuContour } from '../../../src/app/shared/components/cadre/constellation/formes';
import { sansContenu } from '../ouvrir';

export interface AppelDeDessin {
  readonly type: 'stroke' | 'fill';
  readonly alpha: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

const JOURNAL_DES_TOILES = 'journalDesToiles';

export function journaliserLesToiles(): void {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((journal) => {
      const journaux = new WeakMap<object, AppelDeDessin[]>();
      const departs = new WeakMap<object, { x: number; y: number }>();
      const fins = new WeakMap<object, { x: number; y: number }>();
      const prototype = CanvasRenderingContext2D.prototype;
      const { clearRect, moveTo, lineTo, stroke, fill } = prototype;
      const consigner = (contexte: CanvasRenderingContext2D, type: AppelDeDessin['type']) => {
        const de = departs.get(contexte.canvas) ?? { x: Number.NaN, y: Number.NaN };
        const vers = fins.get(contexte.canvas) ?? de;
        journaux
          .get(contexte.canvas)
          ?.push({ type, alpha: contexte.globalAlpha, x1: de.x, y1: de.y, x2: vers.x, y2: vers.y });
      };
      Object.defineProperties(prototype, {
        clearRect: {
          configurable: true,
          value(this: CanvasRenderingContext2D, ...bornes: [number, number, number, number]) {
            journaux.set(this.canvas, []);
            return clearRect.apply(this, bornes);
          },
        },
        moveTo: {
          configurable: true,
          value(this: CanvasRenderingContext2D, x: number, y: number) {
            departs.set(this.canvas, { x, y });
            return moveTo.call(this, x, y);
          },
        },
        lineTo: {
          configurable: true,
          value(this: CanvasRenderingContext2D, x: number, y: number) {
            fins.set(this.canvas, { x, y });
            return lineTo.call(this, x, y);
          },
        },
        stroke: {
          configurable: true,
          value(this: CanvasRenderingContext2D, ...chemin: unknown[]) {
            consigner(this, 'stroke');
            return Reflect.apply(stroke, this, chemin);
          },
        },
        fill: {
          configurable: true,
          value(this: CanvasRenderingContext2D, ...chemin: unknown[]) {
            consigner(this, 'fill');
            return Reflect.apply(fill, this, chemin);
          },
        },
      });
      Object.defineProperty(window, journal, {
        value: (toile: Element | null) => [...((toile && journaux.get(toile)) ?? [])],
      });
    }, JOURNAL_DES_TOILES);
  });
}

export const journalDe = (page: Page, ...toiles: string[]): Promise<AppelDeDessin[][]> =>
  page.evaluate(
    ([journal, visees]) => {
      const lire = Reflect.get(window, journal) as (toile: Element | null) => AppelDeDessin[];
      return visees.map((visee) => lire(document.querySelector(visee)));
    },
    [JOURNAL_DES_TOILES, toiles] as const,
  );

export const placer = (page: Page, selecteur: string, haut: number): Promise<void> =>
  page
    .locator(selecteur)
    .first()
    .evaluate(async (element, voulu) => {
      await document.fonts.ready;
      const ecart = element.getBoundingClientRect().top - voulu;
      if (Math.abs(ecart) < 0.5) return;
      await new Promise((defile) => {
        addEventListener('scroll', defile, { once: true });
        const depart = scrollY;
        scrollBy({ top: ecart, behavior: 'instant' });
        if (scrollY !== depart) return;
        removeEventListener('scroll', defile);
        defile(undefined);
      });
    }, haut);

export const TOILE_DE_FOND = 'canvas.asili-field';

export async function preparerLaToile(page: Page): Promise<void> {
  await sansContenu(page);
  await page.clock.install();
  await page.addInitScript(() => {
    let graine = 42;
    Object.defineProperty(crypto, 'getRandomValues', {
      configurable: true,
      value: (tableau: Uint32Array) => {
        for (let index = 0; index < tableau.length; index++) {
          graine = (graine * 1664525 + 1013904223) >>> 0;
          tableau[index] = graine;
        }
        return tableau;
      },
    });
  });
}

export const opaciteAutour = (
  page: Page,
  selecteur: string,
  x: number,
  y: number,
  demiCote: number,
): Promise<number> =>
  page.evaluate(
    ([toileVisee, cx, cy, cote]) => {
      const toile = document.querySelector<HTMLCanvasElement>(toileVisee);
      const contexte = toile?.getContext('2d');
      if (!toile || !contexte) return -1;
      const boite = toile.getBoundingClientRect();
      const echelle = toile.width / boite.width;
      const { data } = contexte.getImageData(
        Math.round((cx - boite.left - cote) * echelle),
        Math.round((cy - boite.top - cote) * echelle),
        Math.round(2 * cote * echelle) + 1,
        Math.round(2 * cote * echelle) + 1,
      );
      let maximum = 0;
      for (let index = 3; index < data.length; index += 4) maximum = Math.max(maximum, data[index]);
      return maximum;
    },
    [selecteur, x, y, demiCote] as const,
  );

export const image = (page: Page, selecteur = TOILE_DE_FOND): Promise<string> =>
  page.evaluate(
    (toileVisee) => document.querySelector<HTMLCanvasElement>(toileVisee)?.toDataURL() ?? '',
    selecteur,
  );

export const centres = (page: Page, selecteur: string) =>
  page.locator(selecteur).evaluateAll((elements) =>
    elements.map((element) => {
      const boite = element.getBoundingClientRect();
      return { x: boite.left + boite.width / 2, y: boite.top + boite.height / 2 };
    }),
  );

export const defilerJusqua = (page: Page, selecteur: string): Promise<void> =>
  page
    .locator(selecteur)
    .first()
    .evaluate(
      (element) =>
        new Promise<void>((defile) => {
          addEventListener('scroll', () => defile(), { once: true });
          element.scrollIntoView({ block: 'center' });
        }),
    );

export async function exigerUnPointSurChaque(
  page: Page,
  selecteur: string,
  toile = TOILE_DE_FOND,
): Promise<void> {
  const sommets = await centres(page, selecteur);
  expect(sommets.length).toBeGreaterThan(1);
  for (const { x, y } of sommets) {
    expect(await opaciteAutour(page, toile, x, y, 3)).toBeGreaterThanOrEqual(120);
  }
}

async function sommetsAllumesDuContour(page: Page, selecteur: string): Promise<number> {
  const boite = await page.locator(selecteur).first().boundingBox();
  if (!boite) throw new Error(`${selecteur} sans boîte`);
  let allumes = 0;
  for (const { x, y } of sommetsDuContour({
    left: boite.x,
    top: boite.y,
    width: boite.width,
    height: boite.height,
  })) {
    if ((await opaciteAutour(page, TOILE_DE_FOND, x, y, 6)) >= 120) allumes += 1;
  }
  return allumes;
}

export async function contourDeLaPremiereCarteSurvolee(page: Page): Promise<number> {
  const carte = page.locator('.proj').first();
  await carte.scrollIntoViewIfNeeded();
  await carte.hover();
  await page.clock.runFor(2000);
  return sommetsAllumesDuContour(page, '.proj');
}

export function surLaToile(): void {
  test.use({ viewport: { width: 1350, height: 940 }, deviceScaleFactor: 1 });
  test.beforeEach(async ({ page }) => {
    await preparerLaToile(page);
  });
}

export function sansMouvement(): void {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
}
