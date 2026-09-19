import { expect, test } from '@playwright/test';
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

function ecransDuCours() {
  return Array.from({ length: B2_ECRANS }, (_, index) => {
    const rang = index + 1;
    if (rang === 3) {
      return ecranB2Quiz(rang, QUESTION, ['La base', 'Le résultat']);
    }
    return ecranB2Recit(rang, rang === 1 ? 'Lire un chiffre' : undefined);
  });
}

function clesPresentes(valeur: unknown): string[] {
  if (Array.isArray(valeur)) {
    return valeur.flatMap(clesPresentes);
  }
  if (typeof valeur !== 'object' || valeur === null) {
    return [];
  }
  return Object.entries(valeur).flatMap(([cle, contenu]) => [cle, ...clesPresentes(contenu)]);
}

test('le catalogue B2 serveur rend les 72 écrans sans jamais porter de correction', async ({
  page,
}) => {
  await servirCatalogueB2(page, coursB2Catalogue(ecransDuCours()));
  const reponse = page.waitForResponse(`**/formations/catalogue/${B2_SLUG}`);

  await page.goto(`/formations/${B2_SLUG}`);
  const recu: unknown = await (await reponse).json();

  await expect(page.locator('app-slide-deck')).toBeVisible();
  await expect(page.locator('section.slide')).toHaveCount(B2_ECRANS);
  await expect(page.locator('app-slide-hero').first()).toContainText('Lire un chiffre');
  const quiz = page.locator('app-slide-quiz');
  await expect(quiz).toContainText(QUESTION);
  await quiz.locator('.slide-quiz__option').first().click();
  await expect(quiz.locator('[data-testid="slide-quiz-apercu"]')).toBeVisible();
  await expect(quiz.locator('.slide-quiz__feedback, .slide-quiz__explanation')).toHaveCount(0);

  expect(clesPresentes(recu).filter((cle) => CLES_DE_CORRECTION.includes(cle))).toEqual([]);
  const documentRendu = await page.content();
  for (const cle of CLES_DE_CORRECTION) {
    expect(documentRendu).not.toContain(`"${cle}"`);
  }
});
