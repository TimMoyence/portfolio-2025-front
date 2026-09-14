import { expect, test } from '@playwright/test';

const BRIQUES = [
  'fp-vote',
  'fp-numeric',
  'fp-concept4',
  'fp-worked',
  'fp-plot',
  'fp-table-build',
  'fp-sheet',
  'fp-cardsort',
  'fp-escape',
  'fp-challenge',
  'fp-pulse',
  'fp-recall',
  'fp-spaced',
  'fp-exit',
  'fp-quote',
  'fp-story',
  'fp-pro',
];

const MOTS_DE_CORRECTION = [
  'misconception',
  'bareme',
  'barème',
  'corrige',
  'bonneReponse',
  'reponseAttendue',
];

const IDENTITE = {
  studentKey: '11111111-1111-4111-8111-111111111111',
  prenom: 'Theo',
  nom: 'Martin',
  email: 'theo.martin@example.com',
};

async function ouvrirEnEtudiant(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/cours/demo');
  await page.evaluate((identite) => {
    localStorage.setItem('fp.identite', JSON.stringify(identite));
  }, IDENTITE);
  await page.reload();
}

test.describe('Runtime de cours', () => {
  test('la page de demonstration monte la brique de vote', async ({ page }) => {
    await page.goto('/cours/demo');
    await expect(page.locator('[data-testid="cours-identite"]')).toBeVisible();
    await page.fill('#cours-prenom', 'Theo');
    await page.fill('#cours-nom', 'Martin');
    await page.fill('#cours-email', 'theo.martin@example.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('fp-vote')).toBeVisible();
  });

  test('le vote se verrouille apres le choix', async ({ page }) => {
    await page.goto('/cours/demo');
    await page.evaluate(() => {
      localStorage.setItem(
        'fp.identite',
        JSON.stringify({
          studentKey: '11111111-1111-4111-8111-111111111111',
          prenom: 'Theo',
          nom: 'Martin',
          email: 'theo.martin@example.com',
        }),
      );
    });
    await page.reload();
    const option = page.locator('fp-vote [data-testid="option"]').first();
    await option.click();
    await expect(option).toBeDisabled();
  });

  test('chaque brique de la table se monte en role etudiant sans lever', async ({ page }) => {
    const incidents: string[] = [];
    page.on('pageerror', (erreur) => incidents.push(erreur.message));
    await ouvrirEnEtudiant(page);
    await expect(page.locator('[data-testid="cours-galerie"]')).toBeAttached();

    for (const nom of BRIQUES) {
      const rendu = await page
        .locator(nom)
        .first()
        .evaluate((element) => {
          return element.shadowRoot?.childElementCount ?? 0;
        });
      expect(rendu, `${nom} n a rien rendu`).toBeGreaterThan(0);
    }
    expect(incidents, incidents.join(' | ')).toEqual([]);
  });

  test('le HTML servi a l etudiant ne porte aucune donnee de correction', async ({ page }) => {
    await ouvrirEnEtudiant(page);
    await expect(page.locator('[data-testid="cours-galerie"]')).toBeAttached();

    const rendu = await page.evaluate(() => {
      const ombres = [...document.querySelectorAll('*')]
        .map((element) => element.shadowRoot?.innerHTML ?? '')
        .join('\n');
      return `${document.body.innerHTML}\n${ombres}`;
    });
    expect(MOTS_DE_CORRECTION.length).toBeGreaterThan(0);
    for (const mot of MOTS_DE_CORRECTION) {
      expect(rendu, `« ${mot} » apparait dans le HTML servi`).not.toContain(mot);
    }
  });

  test('la page reste lisible a 360 pixels de large', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/cours/demo');
    const largeurDocument = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(largeurDocument).toBeLessThanOrEqual(360);
  });
});
