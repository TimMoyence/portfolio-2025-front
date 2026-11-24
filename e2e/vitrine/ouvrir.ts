import { expect, test, type Page } from '@playwright/test';
import { intercepterApi, servirSansContenu } from '../fixtures';

export const ECRANS_DE_LIGHTHOUSE = [
  { nom: 'mobile Lighthouse', viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75 },
  { nom: 'ordinateur', viewport: { width: 1350, height: 940 }, deviceScaleFactor: 1 },
];

export const sansContenu = (page: Page): Promise<void> =>
  intercepterApi(page, (route) => servirSansContenu(route));

export function sansAnimationNiContenu(): void {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test.beforeEach(async ({ page }) => {
    await sansContenu(page);
  });
}

export async function ouvrir(page: Page, chemin: string): Promise<void> {
  await page.goto(chemin);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}
