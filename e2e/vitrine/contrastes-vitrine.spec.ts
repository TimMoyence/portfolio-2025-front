import { readFileSync } from 'node:fs';
import { expect, test, type Page, type Route } from '@playwright/test';
import { zContactResponseDto } from '../../contrat/zod.gen';
import { contrastesInsuffisants } from '../../src/testing/texte/contrastes-insuffisants';
import { intercepterApi, servirJson, servirRefus, servirSansContenu } from '../fixtures';
import { parcourir, survolsHorsHover, violationsAxe } from '../sondes-de-style';
import { ouvrir as ouvrirLaPage, sansContenu } from './ouvrir';

const FICHES = (
  JSON.parse(readFileSync('src/assets/seo/seo-metadata.json', 'utf8')) as {
    pages: readonly { id: string; path: string }[];
  }
).pages
  .filter(({ id }) => id.startsWith('projet-'))
  .map(({ path }) => path);

const PAGES_VITRINE = [
  '/',
  '/offer',
  '/projets',
  ...FICHES,
  '/presentation',
  '/formations',
  '/formations/cours',
  '/formations/digitale',
  '/contact',
];

test.use({ contextOptions: { reducedMotion: 'reduce' } });

const tealHorsAccent = (page: Page): Promise<string[]> =>
  page.evaluate(() => {
    const AUTRES_TEALS = ['79, 179, 162', '108, 195, 180', '47, 127, 116', '28, 90, 80'];
    const ACCENT = '39, 116, 101';
    const CREME = 'rgb(255, 250, 242)';
    const canaux = (couleur: string): string =>
      /^rgba?\((\d+), (\d+), (\d+)/.exec(couleur)?.slice(1, 4).join(', ') ?? '';
    const ecarts: string[] = [];
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      if (!element.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      const style = getComputedStyle(element);
      const nom = `${element.tagName.toLowerCase()}.${element.className.toString().slice(0, 40)}`;
      const porteDuTexte = Array.from(element.childNodes).some(
        (noeud) => noeud.nodeType === Node.TEXT_NODE && (noeud.textContent ?? '').trim() !== '',
      );
      if (porteDuTexte && AUTRES_TEALS.includes(canaux(style.color))) {
        ecarts.push(`texte ${nom} en ${style.color}`);
      }
      const action = element.matches('a, button');
      const fond = canaux(style.backgroundColor);
      if (action && AUTRES_TEALS.includes(fond)) {
        ecarts.push(`action ${nom} sur ${style.backgroundColor}`);
      }
      if (action && fond === ACCENT && style.color !== CREME) {
        ecarts.push(`action ${nom} en ${style.color} sur l accent`);
      }
    }
    return ecarts;
  });

const ouvrir = async (page: Page, chemin: string): Promise<void> => {
  await ouvrirLaPage(page, chemin);
  await parcourir(page);
};

test.describe('REC-16 · les pages de vente se lisent à 4,5:1', () => {
  test.beforeEach(async ({ page }) => {
    await sansContenu(page);
  });

  test('REC-16 · la mesure lit le texte posé sur le grain du fond, à sa couche la plus sombre', async ({
    page,
  }) => {
    await ouvrir(page, '/');
    await page.evaluate(() => {
      const sonde = document.createElement('p');
      sonde.id = 'sonde';
      sonde.textContent = 'sonde';
      sonde.style.cssText = 'color: #8a8172; font-size: 16px; font-weight: 400';
      document.body.append(sonde);
    });

    expect(await page.locator('#sonde').evaluate(contrastesInsuffisants)).toEqual([
      '« sonde » 3.24:1 < 4.5:1',
    ]);
  });

  for (const chemin of PAGES_VITRINE) {
    test(`REC-16 · ${chemin} : chaque texte tient son contraste, axe compris`, async ({ page }) => {
      await ouvrir(page, chemin);

      expect(await page.locator('body').evaluate(contrastesInsuffisants)).toEqual([]);
      expect(await violationsAxe(page)).toEqual([]);
    });

    test(`REC-16 · ${chemin} : un seul accent, crème dessus`, async ({ page }) => {
      await ouvrir(page, chemin);

      expect(await tealHorsAccent(page)).toEqual([]);
    });

    test(`REC-16 · ${chemin} : le survol ne joue que sous (hover: hover)`, async ({ page }) => {
      await ouvrir(page, chemin);

      expect(await survolsHorsHover(page)).toEqual([]);
    });
  }
});

test.describe('REC-16 · les états du contact se lisent à 4,5:1', () => {
  const remplir = async (page: Page): Promise<void> => {
    await page.locator('#besoin').selectOption('creer');
    await page.locator('input[name="role"]').first().check();
    await page.locator('#firstName').fill('Léa');
    await page.locator('#lastName').fill('Martin');
    await page.locator('#email').fill('lea@exemple.fr');
    await page.locator('#message').fill('Un site pour ma boulangerie.');
    await page.locator('input[name="terms"]').check();
  };

  const formulaire = (page: Page): Promise<readonly string[]> =>
    page.locator('form', { has: page.locator('#besoin') }).evaluate(contrastesInsuffisants);

  test('REC-16 · les erreurs de champ tiennent 4,5:1', async ({ page }) => {
    await sansContenu(page);
    await ouvrir(page, '/contact');
    await page.getByRole('button', { name: 'Envoyer' }).click();

    await expect(page.locator('form [role="alert"][id$="-erreur"]')).toHaveCount(7);
    expect(await formulaire(page)).toEqual([]);
  });

  const envoyer = async (page: Page, repondre: (route: Route) => Promise<void>): Promise<void> => {
    await intercepterApi(page, (route, chemin) =>
      chemin.endsWith('/contacts') ? repondre(route) : servirSansContenu(route),
    );
    await ouvrir(page, '/contact');
    await remplir(page);
    await page.getByRole('button', { name: 'Envoyer' }).click();
  };

  test('REC-16 · le refus du serveur tient 4,5:1', async ({ page }) => {
    await envoyer(page, (route) => servirRefus(route, 500, { title: 'Erreur' }));

    await expect(page.getByText('Une erreur est survenue')).toBeVisible();
    expect(await formulaire(page)).toEqual([]);
  });

  test('REC-16 · le succès tient 4,5:1', async ({ page }) => {
    await envoyer(page, (route) =>
      servirJson(route, zContactResponseDto, { message: 'ok', httpCode: 201 }, 201),
    );

    await expect(page.getByText('Message envoyé')).toBeVisible();
    expect(await formulaire(page)).toEqual([]);
  });
});
