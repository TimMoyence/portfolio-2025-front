import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  SLUG_B2,
  connecterLeFormateur,
  ecransDuRenderer,
  lireLeCatalogue,
  posteDansSonNavigateur,
} from './contexte';
import type { Seance } from './contexte';

const POSTES = 3;

const PREMIER_RANG = 50;

async function ouvrirLePupitre(page: Page): Promise<Seance> {
  await connecterLeFormateur(page);
  await page.goto(`/fr/cours/presenter/${SLUG_B2}`);
  await page.getByTestId('presentateur-ouvrir').click();
  await expect(page.getByTestId('presentateur-code')).toHaveText(/^\d{4}$/);
  const code = ((await page.getByTestId('presentateur-code').textContent()) ?? '').trim();
  await expect(page).toHaveURL(/seance=/);
  const sessionId = new URL(page.url()).searchParams.get('seance') ?? '';
  return { sessionId, code };
}

test.describe('Banc — clôture et synthèse', () => {
  test('le pupitre mène la séance de bout en bout et la synthèse reflète les réponses', async ({
    browser,
    page,
    request,
  }) => {
    const quiz = ecransDuRenderer(await lireLeCatalogue(request), 'quiz');
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
    for (let saut = 0; saut < quiz[0].rang; saut += 1) {
      await page.getByTestId('presentateur-suivant').click();
    }
    await expect(page.getByTestId('presentateur-ecran')).toHaveText(`${quiz[0].rang + 1} / 72`);

    for (const poste of postes) {
      await expect(poste.locator('app-slide-quiz')).toBeVisible();
      await poste.locator('app-slide-quiz button.slide-quiz__option').first().click();
      await expect(poste.getByTestId('etudiant-verdict')).toHaveCount(1);
    }
    await expect(page.getByTestId('presentateur-participants-nombre')).toHaveText(String(POSTES));

    await page.getByTestId('presentateur-cloturer').click();
    await page.getByTestId('presentateur-cloture-confirmer').click();
    await expect(page).toHaveURL(new RegExp(`/cours/seance/${seance.sessionId}/synthese$`));

    for (const poste of postes) {
      await expect(poste.getByTestId('etudiant-fin')).toBeVisible();
    }

    await expect(page.getByTestId('synthese-ligne')).toHaveCount(POSTES);
    const ligne = page.getByTestId('synthese-question-ligne').filter({
      has: page.getByTestId('synthese-question-id').filter({ hasText: quiz[0].activiteId }),
    });
    await expect(ligne.getByTestId('synthese-question-total')).toHaveText(String(POSTES));

    await Promise.all(postes.map((poste) => poste.context().close()));
  });
});
