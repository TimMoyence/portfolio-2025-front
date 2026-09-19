import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  B2_ECRANS,
  B2_SLUG,
  CLES_DE_CORRECTION,
  coursB2Catalogue,
  ecranB2Quiz,
  ecranB2Recit,
  servirCatalogueB2,
} from './fixtures';

const QUESTION = 'Quelle échelle faut-il vérifier ?';

const CORRECTION_SERVIE = {
  correctIndex: 1,
  explanation: 'La base de départ, sinon le pourcentage ne veut rien dire.',
  notes: 'Insister sur la base de départ.',
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

test('ne laisse passer aucune correction dans le DOM même quand le serveur en livre une', async ({
  page,
}) => {
  await ouvrirLeCatalogue(page, CORRECTION_SERVIE);

  const quiz = page.locator('app-slide-quiz');
  await expect(quiz).toContainText(QUESTION);
  await quiz.locator('.slide-quiz__option').first().click();
  await expect(quiz.locator('[data-testid="slide-quiz-apercu"]')).toBeVisible();
  await expect(quiz.locator('.slide-quiz__feedback, .slide-quiz__explanation')).toHaveCount(0);

  const documentRendu = await page.content();
  for (const cle of CLES_DE_CORRECTION) {
    expect(documentRendu).not.toContain(`"${cle}"`);
  }
  for (const secret of Object.values(CORRECTION_SERVIE)) {
    if (typeof secret === 'string') {
      expect(documentRendu).not.toContain(secret);
    }
  }
});
