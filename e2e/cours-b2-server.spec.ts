import { expect, test } from '@playwright/test';
import { API_BASE, B2_SLUG } from './fixtures';

test('L1 · l adresse publique du B2 renvoie au poste étudiant sans monter de deck', async ({
  page,
}) => {
  await page.goto(`/formations/${B2_SLUG}`);

  await expect(page).toHaveURL(/\/cours\/rejoindre$/);
  await expect(page.locator('app-cours-etudiant')).toBeVisible();
  await expect(page.locator('app-slide-deck')).toHaveCount(0);
  await expect(page.locator('section.slide')).toHaveCount(0);
});

test('L1 · n appelle ni le catalogue du cours ni une route de séance', async ({ page }) => {
  const appels: string[] = [];
  page.on('request', (requete) => {
    const adresse = requete.url();
    if (
      adresse.startsWith(`${API_BASE}/formations/catalogue`) ||
      adresse.startsWith(`${API_BASE}/formations/sessions`)
    ) {
      appels.push(adresse);
    }
  });

  await page.goto(`/formations/${B2_SLUG}`);
  await expect(page).toHaveURL(/\/cours\/rejoindre$/);

  expect(appels).toEqual([]);
});

test('L1 · la page de cours publique ne s indexe pas et ne s annonce plus', async ({ page }) => {
  await page.goto(`/formations/${B2_SLUG}`);
  await expect(page).toHaveURL(/\/cours\/rejoindre$/);

  await expect(page.locator('[data-testid="b2-publication"]')).toHaveCount(0);
  await expect(page.getByText('Aperçu : les activités se manipulent librement')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
