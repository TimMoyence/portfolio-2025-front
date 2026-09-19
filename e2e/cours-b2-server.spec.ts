import { expect, test } from '@playwright/test';

const API = 'http://localhost:3000/api/v1/portfolio25';
const SLUG = 'b2-01-traitement-information-chiffree';

function ecran(position: number) {
  const id = `B2-01-S${String(position + 1).padStart(2, '0')}`;
  if (position === 2) {
    return {
      id,
      type: 'fp-quiz',
      duree: 3,
      interactif: true,
      donnees: {
        question: {
          id: 'b2-s03-prediction',
          presentation: {
            version: 2,
            screenId: id,
            renderer: 'quiz',
            props: {
              questionData: {
                id: 'b2-s03-prediction',
                type: 'quiz',
                question: 'Quelle échelle faut-il vérifier ?',
                options: ['La base', 'Le résultat'],
              },
            },
          },
        },
      },
    };
  }
  return {
    id,
    type: 'fp-story',
    duree: 3,
    interactif: false,
    donnees: {
      recit: {
        id,
        presentation: {
          version: 2,
          screenId: id,
          renderer: 'hero',
          props: {
            title: position === 0 ? 'Lire un chiffre' : `Écran ${position + 1}`,
            subtitle: 'Contrôler avant de décider',
            bullets: ['Cours B2 servi par le serveur'],
          },
        },
      },
    },
  };
}

test('le catalogue B2 serveur rend les 72 écrans sans correction étudiante', async ({ page }) => {
  await page.route(`${API}/formations/catalogue/${SLUG}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: SLUG,
        titre: 'Décider avec des taux fiables',
        niveau: 'B2',
        duree: 195,
        concepts: ['taux'],
        ecrans: Array.from({ length: 72 }, (_, position) => ecran(position)),
      }),
    });
  });

  await page.goto('/formations/b2-01-traitement-information-chiffree');

  await expect(page.locator('app-slide-deck')).toBeVisible();
  await expect(page.locator('section.slide')).toHaveCount(72);
  await expect(page.locator('app-slide-hero').first()).toContainText('Lire un chiffre');
  await expect(page.locator('app-slide-quiz')).toContainText('Quelle échelle');
  await expect(page.locator('app-slide-quiz')).not.toContainText('Bonne réponse');
  await expect(page.locator('app-slide-quiz')).not.toContainText('La bonne réponse est');
});
