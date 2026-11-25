import { expect, test, type Page } from '@playwright/test';
import { ECRANS_DE_LIGHTHOUSE, ouvrir, sansContenu } from './ouvrir';
import { baseSsr, exigerLaPorteSsr } from '../porte-ssr';

const PAGES_A_HEROS = ['/', '/offer', '/projets', '/presentation', '/articles', '/contact'];

const RETARD_DES_POLICES_MS = 1500;

const SEUIL_DE_LIGHTHOUSE = 0.1;

interface DecalageDeMiseEnPage extends PerformanceEntry {
  readonly value: number;
  readonly hadRecentInput: boolean;
}

interface FenetreQuiMesure extends Window {
  cls: number;
}

const mesurerLeCls = (): void => {
  const fenetre = window as unknown as FenetreQuiMesure;
  const session = { debut: 0, dernier: 0, somme: 0 };
  fenetre.cls = 0;
  new PerformanceObserver((liste) => {
    for (const entree of liste.getEntries() as DecalageDeMiseEnPage[]) {
      if (entree.hadRecentInput) continue;
      const nouvelleSession =
        entree.startTime - session.dernier > 1000 || entree.startTime - session.debut > 5000;
      if (nouvelleSession) Object.assign(session, { debut: entree.startTime, somme: 0 });
      session.dernier = entree.startTime;
      session.somme += entree.value;
      fenetre.cls = Math.max(fenetre.cls, session.somme);
    }
  }).observe({ type: 'layout-shift', buffered: true });
};

const clsUneFoisLesPolicesArrivees = async (page: Page): Promise<number> => {
  await page.waitForFunction(
    () =>
      document.fonts.status === 'loaded' &&
      [...document.fonts].some((police) => police.status === 'loaded'),
  );
  return page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    return (window as unknown as FenetreQuiMesure).cls;
  });
};

interface FenetreQuiBorne extends Window {
  bornesDesTitres: () => string[];
  bornesAvantLesPolices: string[];
}

const releverLesBornesAvantLesPolices = (): void => {
  const fenetre = window as unknown as FenetreQuiBorne;
  fenetre.bornesDesTitres = () =>
    [...document.querySelectorAll('h1, h2, h3, h4')].map(
      (titre) => `${titre.textContent?.trim().slice(0, 30)} : ${getComputedStyle(titre).maxWidth}`,
    );
  document.addEventListener('DOMContentLoaded', () => {
    fenetre.bornesAvantLesPolices = fenetre.bornesDesTitres();
  });
};

for (const ecran of ECRANS_DE_LIGHTHOUSE) {
  test.describe(`REC-15 · ${ecran.nom} : des polices en retard ne décalent pas la page`, () => {
    test.use({ viewport: ecran.viewport, deviceScaleFactor: ecran.deviceScaleFactor });

    test.beforeEach(async ({ page }) => {
      await sansContenu(page);
      await page.route(/\.woff2?$/, async (route) => {
        await new Promise((suite) => setTimeout(suite, RETARD_DES_POLICES_MS));
        await route.continue();
      });
      await page.addInitScript(mesurerLeCls);
      await page.addInitScript(releverLesBornesAvantLesPolices);
    });

    const clsDeLaPage = async (page: Page, chemin: string): Promise<number> => {
      exigerLaPorteSsr();
      await ouvrir(page, `${baseSsr}/fr${chemin}`);
      return clsUneFoisLesPolicesArrivees(page);
    };

    for (const chemin of PAGES_A_HEROS) {
      test(`REC-15 · ${chemin} en ${ecran.nom} : CLS sous le seuil de Lighthouse quand les polices arrivent`, async ({
        page,
      }) => {
        expect(await clsDeLaPage(page, chemin)).toBeLessThan(SEUIL_DE_LIGHTHOUSE);
      });

      test(`REC-15 · ${chemin} en ${ecran.nom} : la largeur d un titre ne dépend pas de la police chargée`, async ({
        page,
      }) => {
        await clsDeLaPage(page, chemin);

        const { avant, apres } = await page.evaluate(() => {
          const fenetre = window as unknown as FenetreQuiBorne;
          return { avant: fenetre.bornesAvantLesPolices, apres: fenetre.bornesDesTitres() };
        });

        expect(avant.length).toBeGreaterThan(0);
        expect(apres).toEqual(avant);
      });
    }
  });
}
