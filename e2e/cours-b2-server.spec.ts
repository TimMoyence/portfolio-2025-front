import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  API_BASE,
  B2_ECRANS,
  B2_PUBLIE_LE,
  B2_SLUG,
  B2_VERSION_PUBLIEE,
  CLES_DE_CORRECTION,
  coursB2Catalogue,
  ecranB2Quiz,
  ecranB2Recit,
  servirCatalogueB2,
} from './fixtures';

const QUESTION = 'Quelle échelle faut-il vérifier ?';

const DONNEES_DU_FORMATEUR = {
  notes: 'Insister sur la base de départ avant de laisser répondre.',
  corrige: 'La base de départ, sinon le pourcentage ne veut rien dire.',
  solution: 'Réponse attendue : la base de départ du pourcentage.',
  misconception: 'confond-la-base-et-le-resultat',
};

function ecransDuCours(correction: Readonly<Record<string, unknown>> = {}) {
  return Array.from({ length: B2_ECRANS }, (_, index) => {
    const rang = index + 1;
    if (rang === 3) {
      return ecranB2Quiz(rang, QUESTION, ['La base', 'Le résultat'], correction);
    }
    return ecranB2Recit(rang, rang === 1 ? 'Lire un chiffre' : undefined);
  });
}

async function ouvrirLeCatalogue(
  page: Page,
  correction: Readonly<Record<string, unknown>> = {},
): Promise<void> {
  await servirCatalogueB2(page, coursB2Catalogue(ecransDuCours(correction)));
  await page.goto(`/formations/${B2_SLUG}`);
  await expect(page.locator('app-slide-deck')).toBeVisible();
}

test('le rendu du catalogue B2 monte les 72 écrans sans écrire de correction dans le DOM', async ({
  page,
}) => {
  await ouvrirLeCatalogue(page);

  await expect(page.locator('section.slide')).toHaveCount(B2_ECRANS);
  await expect(page.locator('app-slide-hero').first()).toContainText('Lire un chiffre');
  const quiz = page.locator('app-slide-quiz');
  await expect(quiz).toContainText(QUESTION);
  await quiz.locator('.slide-quiz__option').first().click();
  await expect(quiz.locator('[data-testid="slide-quiz-apercu"]')).toBeVisible();
  await expect(quiz.locator('.slide-quiz__feedback, .slide-quiz__explanation')).toHaveCount(0);

  const documentRendu = await page.content();
  for (const cle of CLES_DE_CORRECTION) {
    expect(documentRendu).not.toContain(`"${cle}"`);
  }
});

test('annonce la version publiée du catalogue sans jamais appeler une route de séance', async ({
  page,
}) => {
  const appelsDeSeance: string[] = [];
  page.on('request', (requete) => {
    if (requete.url().startsWith(`${API_BASE}/formations/sessions`)) {
      appelsDeSeance.push(requete.url());
    }
  });

  await ouvrirLeCatalogue(page);

  const publication = page.locator('[data-testid="b2-publication"]');
  await expect(publication).toContainText(String(B2_VERSION_PUBLIEE));
  await expect(publication.locator('time')).toHaveAttribute('datetime', B2_PUBLIE_LE);
  expect(appelsDeSeance).toEqual([]);
});

test('ne projette rien des données du formateur, même quand le serveur en glisse dans la question', async ({
  page,
}) => {
  await ouvrirLeCatalogue(page, DONNEES_DU_FORMATEUR);

  const quiz = page.locator('app-slide-quiz');
  await expect(quiz).toContainText(QUESTION);
  await quiz.locator('.slide-quiz__option').first().click();
  await expect(quiz.locator('[data-testid="slide-quiz-apercu"]')).toBeVisible();
  await expect(quiz.locator('.slide-quiz__feedback, .slide-quiz__explanation')).toHaveCount(0);

  const documentRendu = await page.content();
  for (const [cle, secret] of Object.entries(DONNEES_DU_FORMATEUR)) {
    expect(documentRendu).not.toContain(`"${cle}"`);
    expect(documentRendu).not.toContain(secret);
  }
});
