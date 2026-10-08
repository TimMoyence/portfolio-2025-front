import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { intercepterApi, servirJson, servirSansContenu, SESSION_FORMATEUR } from './fixtures';
import {
  hauteurDePageA,
  hauteursDesEcrans,
  LARGEUR_IMPRIMEE_PX,
  LARGEUR_MAXIMALE_REDUITE_PAR_WEBKIT_PX,
  LARGEUR_UTILE_PX,
  lesPlusHautes,
} from './impression-a4';

const COURS = ['b2-01', 'b2-02', 'b2-03', 'b2-04', 'b2-05', 'b2-06', 'b3-01'] as const;

type Cours = (typeof COURS)[number];

type Vue = 'sujet' | 'corrige';

const FENETRE_ETROITE = { width: 700, height: 600 } as const;

const FENETRE_LARGE = { width: 1600, height: 1400 } as const;

const TEINTES_DE_PAPIER = ['rgb(255, 250, 242)', 'rgb(251, 243, 230)', 'rgb(253, 244, 227)'];

const DEFILEMENT_DU_PARCOURS_MS = 2600;

interface InstantaneDuCours {
  readonly sujet: { readonly id: string };
  readonly deroule: unknown;
}

interface MiseEnPageImprimee {
  readonly largeur: number;
  readonly hauteurs: readonly number[];
}

interface Boite {
  readonly gauche: number;
  readonly droite: number;
}

interface ElementImprime extends Boite {
  readonly description: string;
  readonly ecran: string | null;
  readonly fond: string;
}

interface EcranImprime extends Boite {
  readonly id: string;
}

interface LivretImprime {
  readonly livret: Boite;
  readonly ecrans: readonly EcranImprime[];
  readonly elements: readonly ElementImprime[];
}

function instantaneDe(cours: Cours): InstantaneDuCours {
  return JSON.parse(
    readFileSync(`src/testing/fixtures/${cours}.instantane.json`, 'utf8'),
  ) as InstantaneDuCours;
}

function preuvesEtResultatsDesParcours(valeur: unknown): readonly string[] {
  if (typeof valeur !== 'object' || valeur === null) {
    return [];
  }
  const objet = valeur as Readonly<Record<string, unknown>>;
  if (objet['renderer'] === 'method-path') {
    const { steps } = objet['props'] as {
      readonly steps: readonly { readonly proof: string; readonly result: string }[];
    };
    return steps.flatMap(({ proof, result }) => [proof, result]);
  }
  return Object.values(objet).flatMap(preuvesEtResultatsDesParcours);
}

async function servirLeLivret(page: Page, cours: Cours): Promise<string> {
  const { sujet, deroule } = instantaneDe(cours);
  await intercepterApi(page, async (route, chemin) => {
    if (chemin.endsWith('/auth/refresh')) {
      await servirJson(route, SESSION_FORMATEUR);
    } else if (chemin.endsWith('/auth/me')) {
      await servirJson(route, SESSION_FORMATEUR.user);
    } else if (chemin.endsWith(`/formations/livrets/${sujet.id}`)) {
      await servirJson(route, { version: 4, sujet, corrige: deroule });
    } else {
      await servirSansContenu(route);
    }
  });
  return sujet.id;
}

async function imprimerLeLivret(
  page: Page,
  slug: string,
  vue: Vue,
  fenetre: { readonly width: number; readonly height: number },
): Promise<void> {
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize(fenetre);
  await page.goto(`/cours/presenter/${slug}/livret`);
  await page.getByTestId(`livret-vue-${vue}`).click();
  await expect(page.locator('[data-ecran]').first()).toBeVisible();
  await page.emulateMedia({ media: 'print' });
}

async function imprimerEnFenetreLarge(page: Page, cours: Cours, vue: Vue): Promise<void> {
  const slug = await servirLeLivret(page, cours);
  await imprimerLeLivret(page, slug, vue, FENETRE_LARGE);
}

function miseEnPage(page: Page): Promise<MiseEnPageImprimee> {
  return page.locator('.livret').evaluate((livret) => ({
    largeur: Math.round(livret.getBoundingClientRect().width),
    hauteurs: [...livret.querySelectorAll('[data-ecran]')].map((ecran) =>
      Math.round(ecran.getBoundingClientRect().height),
    ),
  }));
}

async function miseEnPageStable(page: Page): Promise<MiseEnPageImprimee> {
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page
        .locator('.livret app-slide-activity')
        .evaluateAll((activites) =>
          activites.every((activite) => activite.getBoundingClientRect().height > 0),
        ),
    )
    .toBe(true);
  let precedente = await miseEnPage(page);
  await expect
    .poll(
      async () => {
        const courante = await miseEnPage(page);
        const stable = JSON.stringify(courante) === JSON.stringify(precedente);
        precedente = courante;
        return stable;
      },
      { intervals: [500] },
    )
    .toBe(true);
  return precedente;
}

function livretImprime(page: Page): Promise<LivretImprime> {
  return page.locator('.livret').evaluate((livret) => {
    const boite = (element: Element): Boite => {
      const { left, right } = element.getBoundingClientRect();
      return { gauche: left, droite: right };
    };
    const elements: Element[] = [document.documentElement, document.body];
    const parcourir = (racine: ParentNode): void => {
      for (const element of racine.querySelectorAll('*')) {
        elements.push(element);
        if (element.shadowRoot !== null) {
          parcourir(element.shadowRoot);
        }
      }
    };
    parcourir(livret);
    const ecranDe = (element: Element): string | null => {
      const section = element.closest('[data-ecran]');
      if (section !== null) {
        return section.getAttribute('data-ecran');
      }
      const racine = element.getRootNode();
      return racine instanceof ShadowRoot ? ecranDe(racine.host) : null;
    };
    return {
      livret: boite(livret),
      ecrans: [...livret.querySelectorAll('[data-ecran]')].map((section) => ({
        ...boite(section),
        id: section.getAttribute('data-ecran') ?? '',
      })),
      elements: elements
        .filter((element) => element.getBoundingClientRect().width > 0)
        .map((element) => ({
          ...boite(element),
          description: `${element.tagName.toLowerCase()}.${String(element.className).split(' ')[0]}`,
          ecran: ecranDe(element),
          fond: getComputedStyle(element).backgroundColor,
        })),
    };
  });
}

test.describe('livret papier imprimé', () => {
  test('le voile décoratif du fond ne s’imprime pas', async ({ page }) => {
    await imprimerEnFenetreLarge(page, 'b2-02', 'sujet');

    const voile = await page.evaluate(() => getComputedStyle(document.body, '::before').display);

    expect(voile).toBe('none');
  });

  test('aucun élément du livret imprimé n’est zoomé', async ({ page }) => {
    await imprimerEnFenetreLarge(page, 'b2-01', 'sujet');

    const zoomes = await page
      .locator('.livret, .livret *')
      .evaluateAll((elements) =>
        elements
          .filter((element) => getComputedStyle(element).zoom !== '1')
          .map((element) => element.tagName.toLowerCase()),
      );

    expect([...new Set(zoomes)]).toEqual([]);
  });

  for (const vue of ['sujet', 'corrige'] as const) {
    test(`aucune image du ${vue} n’attend d’entrer dans la fenêtre pour se charger, Safari imprimant une image différée vide`, async ({
      page,
    }) => {
      const slug = await servirLeLivret(page, 'b2-01');
      await imprimerLeLivret(page, slug, vue, FENETRE_ETROITE);

      const chargements = await page
        .locator('.livret img')
        .evaluateAll((images) => images.map((image) => image.getAttribute('loading')));

      expect(chargements.length).toBeGreaterThan(0);
      expect(chargements.filter((chargement) => chargement === 'lazy')).toEqual([]);
    });
  }

  test('la largeur imprimée, dont dépend chaque retour à la ligne, est fixe et indépendante des marges, tient sous le plafond de réduction de WebKit et rien ne la déborde', async ({
    page,
  }) => {
    const slug = await servirLeLivret(page, 'b2-01');
    await imprimerLeLivret(page, slug, 'sujet', FENETRE_ETROITE);
    const { largeur } = await miseEnPageStable(page);
    const deborde = await page
      .locator('.livret')
      .evaluate((livret) => livret.scrollWidth > Math.ceil(livret.getBoundingClientRect().width));

    expect(largeur).toBe(LARGEUR_IMPRIMEE_PX);
    expect(largeur).toBeGreaterThanOrEqual(LARGEUR_UTILE_PX);
    expect(largeur).toBeLessThan(LARGEUR_MAXIMALE_REDUITE_PAR_WEBKIT_PX);
    expect(deborde).toBe(false);
  });

  test('les marges de la page A4 tombent sur des pixels CSS entiers, que Chrome arrondirait sinon en une page plus courte que celle de Safari', async ({
    page,
  }) => {
    await imprimerEnFenetreLarge(page, 'b2-02', 'sujet');

    const marges = await page.evaluate(() =>
      [...document.styleSheets]
        .flatMap((feuille) => [...feuille.cssRules])
        .filter((regle): regle is CSSPageRule => regle instanceof CSSPageRule)
        .flatMap((regle) =>
          ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'].map((cote) =>
            regle.style.getPropertyValue(cote),
          ),
        ),
    );

    expect(marges.length).toBeGreaterThan(0);
    expect(marges.filter((marge) => !/^\d+px$/.test(marge))).toEqual([]);
  });

  for (const vue of ['sujet', 'corrige'] as const) {
    test(`le ${vue} s’imprime sur fond blanc, sans aplat crème ni ivoire qu’une impression en série multiplierait`, async ({
      page,
    }) => {
      await imprimerEnFenetreLarge(page, 'b2-02', vue);
      await miseEnPageStable(page);

      const { elements } = await livretImprime(page);
      const aplats = elements
        .filter(({ fond }) => TEINTES_DE_PAPIER.includes(fond))
        .map(({ description }) => description);

      expect(elements.length).toBeGreaterThan(0);
      expect([...new Set(aplats)]).toEqual([]);
    });
  }

  test('une gouttière écarte chaque écran du bord de la largeur imprimée, dont WebKit rogne une fraction de pixel', async ({
    page,
  }) => {
    await imprimerEnFenetreLarge(page, 'b2-02', 'sujet');
    await miseEnPageStable(page);

    const { livret, ecrans } = await livretImprime(page);
    const colles = ecrans
      .filter(({ gauche, droite }) => gauche < livret.gauche + 1 || droite > livret.droite - 1)
      .map(({ id }) => id);

    expect(ecrans.length).toBeGreaterThan(0);
    expect(colles).toEqual([]);
  });

  test('chaque écran de cours imprime ses cartes sur une seule rangée', async ({ page }) => {
    await imprimerEnFenetreLarge(page, 'b2-02', 'sujet');
    await miseEnPageStable(page);

    const rangees = await page
      .locator('.livret .slide-lesson__blocks')
      .evaluateAll((grilles) =>
        grilles.map(
          (grille) =>
            new Set(
              [...grille.children].map((carte) => Math.round(carte.getBoundingClientRect().top)),
            ).size,
        ),
      );

    expect(rangees.length).toBeGreaterThan(0);
    expect(rangees.filter((nombre) => nombre !== 1)).toEqual([]);
  });

  test('une fiche repart sur une page neuve, sauf l’exercice qui suit son exemple guidé et la question seule qui ouvre une notion', async ({
    page,
  }) => {
    await imprimerEnFenetreLarge(page, 'b2-02', 'sujet');

    const pagesNeuves = await page
      .getByTestId('livret-feuille')
      .evaluateAll((feuilles) =>
        feuilles.flatMap((feuille, rang) =>
          getComputedStyle(feuille).breakBefore === 'page' ? [rang + 1] : [],
        ),
      );

    expect(pagesNeuves).toEqual([2, 4, 5, 7, 9, 11, 12, 13, 14, 15]);
  });

  test('une fiche n’imprime que des blocs d’un seul tenant, son en-tête ne restant jamais seul en bas d’une page', async ({
    page,
  }) => {
    await imprimerEnFenetreLarge(page, 'b2-02', 'sujet');

    const lignesSeules = await page
      .locator('.livret__feuille > *')
      .evaluateAll((enfants) =>
        enfants
          .filter((enfant) => !getComputedStyle(enfant).display.startsWith('inline-'))
          .map((enfant) => `${enfant.tagName.toLowerCase()}.${enfant.className}`),
      );

    expect(lignesSeules).toEqual([]);
  });

  test('le livret imprimé reprend la densité des briques et les marges de cadre de la projection', async ({
    page,
  }) => {
    await imprimerEnFenetreLarge(page, 'b2-02', 'sujet');

    const reglages = await page
      .locator('.livret')
      .evaluate((livret) =>
        ['--slide-marge-bloc', '--slide-marge-ligne', '--fp-densite-imposee'].map((propriete) =>
          getComputedStyle(livret).getPropertyValue(propriete).trim(),
        ),
      );

    expect(reglages).toEqual(['0', '0', '0.75']);
  });

  test('un parcours de méthode imprime chaque étape avec sa preuve et son résultat, quel que soit l’instant de l’impression', async ({
    page,
  }) => {
    const attendus = preuvesEtResultatsDesParcours(instantaneDe('b2-01').sujet);
    await page.clock.install();
    await imprimerEnFenetreLarge(page, 'b2-01', 'sujet');

    const parcours = page.locator('.livret app-slide-method-path');
    const texteImprime = (): Promise<string> =>
      parcours.evaluate((element) => (element as HTMLElement).innerText);
    const avantDefilement = await texteImprime();
    await page.clock.fastForward(DEFILEMENT_DU_PARCOURS_MS);

    expect(attendus.length).toBeGreaterThan(0);
    expect(attendus.filter((attendu) => !avantDefilement.includes(attendu))).toEqual([]);
    expect(await texteImprime()).toBe(avantDefilement);
  });

  for (const cours of COURS) {
    test(`${cours} · aucun élément ne déborde de son écran imprimé, champ et unité compris`, async ({
      page,
    }) => {
      const slug = await servirLeLivret(page, cours);
      const debordants: string[] = [];
      for (const vue of ['sujet', 'corrige'] as const) {
        await imprimerLeLivret(page, slug, vue, FENETRE_LARGE);
        await miseEnPageStable(page);
        const { ecrans, elements } = await livretImprime(page);
        const boites = new Map(ecrans.map((ecran) => [ecran.id, ecran]));
        debordants.push(
          ...elements
            .filter(({ ecran, gauche, droite }) => {
              const boite = boites.get(ecran ?? '');
              return (
                boite !== undefined && (gauche < boite.gauche - 0.5 || droite > boite.droite + 0.5)
              );
            })
            .map(({ ecran, description }) => `${vue} · ${ecran ?? ''} · ${description}`),
        );
      }

      expect(debordants).toEqual([]);
    });
  }

  for (const vue of ['sujet', 'corrige'] as const) {
    test(`le ${vue} ne se pagine qu’entre des blocs d’un seul tenant, rognés à leur boîte que WebKit étendrait sinon à leurs ombres`, async ({
      page,
    }) => {
      await imprimerEnFenetreLarge(page, 'b2-04', vue);
      await miseEnPageStable(page);

      const { unites, fragmentables, debordants } = await page
        .locator('.livret')
        .evaluate((livret) => {
          const decrire = (element: Element): string =>
            `${element.tagName.toLowerCase()}.${element.className} : ${getComputedStyle(element).display}`;
          const enFlux = (element: Element): boolean => {
            const style = getComputedStyle(element);
            return style.display === 'block' && style.orphans === '1' && style.widows === '1';
          };
          const insecables: Element[] = [];
          const fragmentable = (element: Element): string[] => {
            const { display } = getComputedStyle(element);
            if (display.startsWith('inline-')) {
              insecables.push(element);
            }
            if (display === 'none' || display.startsWith('inline-')) {
              return [];
            }
            return enFlux(element)
              ? [...element.children].flatMap(fragmentable)
              : [decrire(element)];
          };
          const pages = [...livret.querySelectorAll('.livret__page')];
          const pagesFragmentables = pages.flatMap(fragmentable);
          return {
            unites: insecables.length,
            fragmentables: [
              ...[livret, ...livret.querySelectorAll('.livret__feuille')]
                .filter((conteneur) => !enFlux(conteneur))
                .map(decrire),
              ...pagesFragmentables,
            ],
            debordants: insecables
              .filter((insecable) => getComputedStyle(insecable).overflowY !== 'clip')
              .map(decrire),
          };
        });
      const ombres = await page
        .locator('.livret .fp-carte')
        .evaluateAll((cartes) =>
          cartes
            .map((carte) => getComputedStyle(carte).boxShadow)
            .filter((ombre) => ombre !== 'none'),
        );

      expect(unites).toBeGreaterThan(0);
      expect(fragmentables).toEqual([]);
      expect(debordants).toEqual([]);
      expect(ombres).toEqual([]);
    });
  }

  for (const cours of COURS) {
    test(`${cours} · chaque légende flotte hors de toute grille, WebKit ramenant sinon la légende dans la bordure de son fieldset`, async ({
      page,
    }) => {
      const slug = await servirLeLivret(page, cours);
      const champs: { readonly fieldset: string; readonly legende: string }[] = [];
      for (const vue of ['sujet', 'corrige'] as const) {
        await imprimerLeLivret(page, slug, vue, FENETRE_LARGE);
        await miseEnPageStable(page);
        champs.push(
          ...(await page.locator('.livret fieldset:has(> legend)').evaluateAll((fieldsets) =>
            fieldsets.map((fieldset) => ({
              fieldset: getComputedStyle(fieldset).display,
              legende: getComputedStyle(fieldset.querySelector(':scope > legend') ?? fieldset)
                .float,
            })),
          )),
        );
      }

      expect(champs.length).toBeGreaterThan(0);
      expect(
        champs.filter(({ fieldset, legende }) => /grid|flex/.test(fieldset) || legende !== 'left'),
      ).toEqual([]);
    });
  }

  for (const cours of COURS) {
    for (const vue of ['sujet', 'corrige'] as const) {
      test(`${cours} · aucun écran du ${vue} ne dépasse une page A4, qui le trancherait au milieu d’une ligne`, async ({
        page,
      }) => {
        await imprimerEnFenetreLarge(page, cours, vue);
        const { largeur } = await miseEnPageStable(page);
        const hauteurDePage = hauteurDePageA(largeur);
        const ecrans = await hauteursDesEcrans(page.locator('.livret [data-ecran]'));
        test.info().annotations.push({
          type: 'hauteurs',
          description: `page ${hauteurDePage} px ; ${lesPlusHautes(ecrans)}`,
        });

        expect(ecrans.length).toBeGreaterThan(0);
        expect(ecrans.filter(({ hauteur }) => hauteur > hauteurDePage)).toEqual([]);
      });

      test(`${cours} · le ${vue} se met en page à l’identique quelle que soit la fenêtre`, async ({
        page,
      }) => {
        const slug = await servirLeLivret(page, cours);
        await imprimerLeLivret(page, slug, vue, FENETRE_ETROITE);
        const etroite = await miseEnPageStable(page);
        await imprimerLeLivret(page, slug, vue, FENETRE_LARGE);
        const large = await miseEnPageStable(page);

        expect(etroite.hauteurs.length).toBeGreaterThan(0);
        expect(large).toEqual(etroite);
      });
    }
  }
});
