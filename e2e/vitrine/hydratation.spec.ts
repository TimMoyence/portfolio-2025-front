import { expect, test, type Page } from '@playwright/test';
import { sansContenu } from './ouvrir';
import { baseAnglaise, baseSsr, exigerLaPorteSsr } from '../porte-ssr';

const PAGES = ['/', '/offer', '/projets', '/presentation', '/contact'];

const PORTRAIT = 'portrait-tim-asili-design.webp';

const noterLesPremiersNoeuds = (): void => {
  const premiers: Record<string, Element | undefined> = {};
  new MutationObserver((mutations) => {
    for (const { addedNodes } of mutations) {
      for (const noeud of Array.from(addedNodes)) {
        if (!(noeud instanceof Element)) continue;
        for (const selecteur of ['h1', 'nav']) {
          premiers[selecteur] ??=
            (noeud.matches(selecteur) ? noeud : noeud.querySelector(selecteur)) ?? undefined;
        }
      }
    }
  }).observe(document, { childList: true, subtree: true });
  Object.assign(window, { premiersNoeuds: premiers });
};

const ouvrirStable = async (page: Page, url: string): Promise<string[]> => {
  const erreurs: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /NG0?5\d\d/.test(message.text()))
      erreurs.push(message.text());
  });
  await sansContenu(page);
  await page.addInitScript(noterLesPremiersNoeuds);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('app-root[ng-version]') !== null);
  return erreurs;
};

const memesNoeuds = (page: Page): Promise<Record<string, boolean>> =>
  page.evaluate(() => {
    const premiers = (window as unknown as { premiersNoeuds: Record<string, Element | undefined> })
      .premiersNoeuds;
    return {
      h1: premiers['h1'] !== undefined && document.querySelector('h1') === premiers['h1'],
      nav: premiers['nav'] !== undefined && document.querySelector('nav') === premiers['nav'],
    };
  });

test.describe('REC-15 · la page servie est celle qui reste', () => {
  for (const [langue, base] of [
    ['fr', () => baseSsr],
    ['en', () => baseAnglaise],
  ] as const) {
    for (const chemin of PAGES) {
      test(`REC-15 · /${langue}${chemin} : le h1 et le nav servis sont ceux de l application stable`, async ({
        page,
      }) => {
        exigerLaPorteSsr({ anglaise: langue === 'en' });
        const erreurs = await ouvrirStable(page, `${base()}/${langue}${chemin}`);

        expect(await memesNoeuds(page)).toEqual({ h1: true, nav: true });
        expect(erreurs).toEqual([]);
        expect(await page.content()).not.toMatch(/ngskiphydration/i);
      });
    }
  }

  test('REC-15 · seul /presentation précharge le portrait, sans le différer', async ({
    request,
  }) => {
    exigerLaPorteSsr();
    const accueil = await (await request.get(`${baseSsr}/fr/`)).text();
    const presentation = await (await request.get(`${baseSsr}/fr/presentation`)).text();
    const prechargement = new RegExp(
      `<link[^>]*rel="preload"[^>]*${PORTRAIT}|<link[^>]*${PORTRAIT}[^>]*rel="preload"`,
    );

    expect(accueil).not.toMatch(prechargement);
    expect(presentation).toMatch(prechargement);
    expect(presentation).toMatch(new RegExp(`<img[^>]*${PORTRAIT}`));
    expect(presentation).not.toMatch(new RegExp(`<img[^>]*${PORTRAIT}[^>]*loading="lazy"`));
  });

  test('REC-15 · Swiper ne se charge qu à l ouverture des slides en plein écran', async ({
    page,
  }) => {
    exigerLaPorteSsr();
    const swiperDefini = (): Promise<boolean> =>
      page.evaluate(() => customElements.get('swiper-container') !== undefined);

    await ouvrirStable(page, `${baseSsr}/fr/`);
    expect(await swiperDefini()).toBe(false);

    await page.goto(`${baseSsr}/fr/formations/ia-solopreneurs`, { waitUntil: 'networkidle' });
    expect(await swiperDefini()).toBe(false);

    await page.getByTestId('bandeau-cookies-compris').click();
    await page.getByTestId('slide-deck-fullscreen-toggle').click();
    await expect.poll(swiperDefini).toBe(true);
    await expect(page.locator('swiper-container')).toBeVisible();
  });
});
