import { expect, type Page, test } from '@playwright/test';
import { COURS_EN_SEANCE } from '../../src/app/core/config/cours-en-seance';
import { baseAnglaise, baseSsr, exigerLaPorteSsr } from '../porte-ssr';

const CARTES = COURS_EN_SEANCE.length + 4;

const ouvrirHydrate = async (page: Page, adresse: string): Promise<void> => {
  await page.goto(adresse, { waitUntil: 'networkidle' });
  await expect(page.locator('html.anim-ready')).toHaveCount(1);
};

test.describe('CAT-06 · catalogue des formations servi', () => {
  exigerLaPorteSsr({ anglaise: true });

  test('CAT-06 · la recherche filtre le catalogue prérendu, et dit le nombre affiché', async ({
    page,
  }) => {
    await ouvrirHydrate(page, `${baseSsr}/fr/formations`);
    const cartes = page.locator('app-formations-list .formation');
    await expect(cartes).toHaveCount(CARTES);

    await page.getByRole('searchbox', { name: 'Rechercher une formation' }).fill('amortissement');

    await expect(cartes).toHaveCount(1);
    await expect(cartes).toContainText('B2-05');
    await expect(page.getByRole('status')).toHaveText('1 formation');
  });

  test('CAT-06 · une puce ne garde que son parcours et s annonce pressée', async ({ page }) => {
    await ouvrirHydrate(page, `${baseSsr}/fr/formations`);
    const puce = page.getByRole('group', { name: 'Parcours' }).getByRole('button', {
      name: /^Bachelor 3/,
    });

    await puce.click();

    await expect(puce).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('app-formations-list .formation')).toHaveCount(
      COURS_EN_SEANCE.filter((slug) => slug.startsWith('b3-')).length,
    );
    await expect(page.locator('app-formations-list').getByRole('heading', { level: 2 })).toHaveText(
      [/^\s*Bachelor 3/],
    );
  });

  test('CAT-06 · un rechargement rend un champ vide et tout le catalogue', async ({ page }) => {
    await ouvrirHydrate(page, `${baseSsr}/fr/formations`);
    await page.getByRole('searchbox', { name: 'Rechercher une formation' }).fill('amortissement');

    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.getByRole('searchbox', { name: 'Rechercher une formation' })).toHaveValue('');
    await expect(page.locator('app-formations-list .formation')).toHaveCount(CARTES);
  });

  test('CAT-06 · en anglais, rien ne correspond, puis « Show all » rend tout le catalogue', async ({
    page,
  }) => {
    await ouvrirHydrate(page, `${baseAnglaise}/en/formations`);
    await expect(page.getByRole('status')).toHaveText(`${CARTES} courses`);
    const champ = page.getByRole('searchbox', { name: 'Search courses' });

    await champ.fill('zzz');

    await expect(page.getByText('No course matches “zzz”')).toBeVisible();
    await page.getByRole('button', { name: 'Show all' }).click();
    await expect(page.locator('app-formations-list .formation')).toHaveCount(CARTES);
    await expect(champ).toBeFocused();
  });

  test('CAT-06 · le bandeau, les puces et les sections tiennent sur téléphone sans débordement', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await ouvrirHydrate(page, `${baseSsr}/fr/formations`);

    const largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(largeur).toBeLessThanOrEqual(390);
    await expect(
      page.getByRole('searchbox', { name: 'Rechercher une formation' }),
    ).toBeInViewport();
  });
});
