import { expect, test, type Page } from '@playwright/test';
import { sansContenu } from './ouvrir';
import { baseAnglaise, exigerLaPorteSsr } from '../porte-ssr';

const ouvrirEnAnglais = async (page: Page, chemin: string): Promise<void> => {
  exigerLaPorteSsr({ anglaise: true });
  await sansContenu(page);
  await page.setViewportSize({ width: 1350, height: 940 });
  await page.goto(`${baseAnglaise}/en${chemin}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
};

const liens = (page: Page, zone: string): Promise<[string, string][]> =>
  page
    .locator(zone)
    .evaluateAll((elements) =>
      elements.map((lien): [string, string] => [
        lien.getAttribute('href') ?? '',
        (lien.querySelector('.asili-drop-item__title') ?? lien).textContent?.trim() ?? '',
      ]),
    );

test.describe('SEO-5 · un nom court ne s écrit qu une fois, et /en/ le sert en anglais', () => {
  test('SEO-5 · la fiche Gestion de chais s intitule Winery management sur /en/', async ({
    page,
  }) => {
    await ouvrirEnAnglais(page, '/projets/gestion-de-chais');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Winery management');
    await expect(page).toHaveTitle('Winery management — Asili Design');
  });

  test('SEO-5 · la carte de la réalisation porte son nom anglais sur /en/projets', async ({
    page,
  }) => {
    await ouvrirEnAnglais(page, '/projets');

    await expect(page.locator('main')).toContainText('Winery management');
    await expect(page.locator('main')).not.toContainText('Gestion de chais');
  });

  test('SEO-5 · le menu /en/ nomme chaque page par son nom court anglais', async ({ page }) => {
    await ouvrirEnAnglais(page, '/');

    expect(
      await liens(page, '.asili-nav__links a.asili-nav__link, .asili-nav__links a.asili-drop-item'),
    ).toEqual([
      ['/en/offer', 'Build my website'],
      ['/en/projets', 'Work'],
      ['/en/articles', 'Articles'],
      ['/en/formations/digitale', 'Digital training'],
      ['/en/formations/cours', 'Classroom courses'],
      ['/en/presentation', 'About'],
    ]);
  });

  test('SEO-5 · le pied de page /en/ nomme ses pages par leur nom court anglais', async ({
    page,
  }) => {
    await ouvrirEnAnglais(page, '/');

    expect(await liens(page, 'footer nav a[href^="/en/"], footer .asili-footer__legal a')).toEqual([
      ['/en/offer', 'Build my website'],
      ['/en/formations', 'Courses'],
      ['/en/projets', 'Work'],
      ['/en/articles', 'Articles'],
      ['/en/growth-audit', 'Free diagnosis'],
      ['/en/contact', 'Contact'],
      ['/en/presentation', 'About'],
      ['/en/terms', 'Terms of use'],
      ['/en/privacy', 'Privacy policy'],
    ]);
  });
});
