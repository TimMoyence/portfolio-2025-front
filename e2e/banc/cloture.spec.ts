import { expect, test } from '@playwright/test';
import {
  avancerLePupitre,
  cloturerDepuisLePupitre,
  coursReleve,
  optionsDuPoste,
  ouvrirLePupitre,
  posteDansSonNavigateur,
  verdictDuPoste,
} from './contexte';

const POSTES = 3;

const PREMIER_RANG = 50;

test.describe('Banc — clôture et synthèse', () => {
  test('le pupitre mène la séance de bout en bout et la synthèse reflète les réponses', async ({
    browser,
    page,
    request,
  }) => {
    const { votes, total } = await coursReleve(request);
    const vote = votes[0];
    const seance = await ouvrirLePupitre(page);
    expect(seance.sessionId).not.toBe('');

    const postes = [];
    for (let rang = 0; rang < POSTES; rang += 1) {
      postes.push(await posteDansSonNavigateur(browser, seance, PREMIER_RANG + rang));
    }
    for (const poste of postes) {
      await expect(poste.getByTestId('etudiant-attente')).toBeVisible();
    }

    await page.getByTestId('presentateur-demarrer').click();
    await avancerLePupitre(page, 0, vote.rang, total);

    for (const poste of postes) {
      await expect(optionsDuPoste(poste).first()).toBeVisible();
      await optionsDuPoste(poste).first().click();
      await expect(verdictDuPoste(poste)).toHaveCount(1);
    }
    await expect(page.getByTestId('presentateur-participants-nombre')).toHaveText(String(POSTES));

    await cloturerDepuisLePupitre(page, seance, postes);

    await expect(page.getByTestId('synthese-ligne')).toHaveCount(POSTES);
    const ligne = page.getByTestId('synthese-question-ligne').filter({
      has: page.getByTestId('synthese-question-id').filter({ hasText: vote.activiteId }),
    });
    await expect(ligne.getByTestId('synthese-question-total')).toHaveText(String(POSTES));

    await Promise.all(postes.map((poste) => poste.context().close()));
  });
});
