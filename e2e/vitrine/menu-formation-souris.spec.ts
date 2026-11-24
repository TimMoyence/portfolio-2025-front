import { expect, test } from '@playwright/test';
import { sansContenu } from './ouvrir';

test.describe('REC-03 · à la souris, cliquer Formation garde le menu ouvert', () => {
  test.beforeEach(async ({ page }) => {
    await sansContenu(page);
    await page.goto('/');
  });

  test('REC-03 · survoler puis cliquer Formation : le menu reste ouvert, ses deux entrées visibles', async ({
    page,
  }) => {
    const declencheur = page.locator('.asili-nav__links .asili-nav__trigger');

    await declencheur.hover();
    await expect(declencheur).toHaveAttribute('aria-expanded', 'true');
    await declencheur.click();

    await expect(declencheur).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.asili-nav__links .asili-dropdown a.asili-drop-item')).toHaveCount(
      2,
    );
    await expect(page.locator('.asili-nav__links .asili-dropdown')).toBeVisible();
  });

  test('REC-03 · au clavier, Entrée ouvre puis referme Formation', async ({ page }) => {
    const declencheur = page.locator('.asili-nav__links .asili-nav__trigger');
    await declencheur.focus();

    await page.keyboard.press('Enter');
    await expect(declencheur).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Enter');
    await expect(declencheur).toHaveAttribute('aria-expanded', 'false');
  });

  test('REC-03 · la souris qui quitte Formation referme le menu', async ({ page }) => {
    const declencheur = page.locator('.asili-nav__links .asili-nav__trigger');
    await declencheur.hover();
    await declencheur.click();

    await page.mouse.move(5, 600);
    await expect(declencheur).toHaveAttribute('aria-expanded', 'false');
  });
});
