import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  URL_API,
  ecransDuRenderer,
  identiteDuPoste,
  inscrireUnPoste,
  lireLeCatalogue,
  lireLesResultats,
  posteDansSonNavigateur,
  repondreDepuisLePoste,
  seanceDemarreeSurLEcran,
  servirLEcran,
} from './contexte';

const CAPACITE = 35;

const NAVIGATEURS = 3;

const REPONSES_PAR_POSTE = 2;

const PREMIER_RANG = 100;

test.describe('Banc — salle chargée derrière une seule adresse', () => {
  test('trente-cinq postes rejoignent, le trente-sixième est refusé, le débit suit le jeton', async ({
    browser,
    request,
  }) => {
    const quiz = ecransDuRenderer(await lireLeCatalogue(request), 'quiz');
    const { seance, jeton } = await seanceDemarreeSurLEcran(request, quiz[0].rang, {
      capacite: CAPACITE,
    });

    const pages: Page[] = [];
    for (let rang = 0; rang < NAVIGATEURS; rang += 1) {
      pages.push(await posteDansSonNavigateur(browser, seance, PREMIER_RANG + rang));
    }
    for (const page of pages) {
      await expect(page.locator('app-slide-quiz')).toBeVisible();
    }

    const postes = [];
    for (let rang = NAVIGATEURS; rang < CAPACITE; rang += 1) {
      postes.push(await inscrireUnPoste(request, seance, PREMIER_RANG + rang));
    }
    expect(postes).toHaveLength(CAPACITE - NAVIGATEURS);

    const identiteDeTrop = identiteDuPoste(PREMIER_RANG + CAPACITE);
    const refus = await request.post(`${URL_API}/formations/sessions/${seance.code}/join`, {
      data: identiteDeTrop,
    });
    expect(refus.status()).toBe(409);
    expect(((await refus.json()) as { code: string }).code).toBe('SEANCE_COMPLETE');

    const statuts: number[] = [];
    for (let tour = 0; tour < REPONSES_PAR_POSTE; tour += 1) {
      await servirLEcran(request, jeton, seance.sessionId, quiz[tour].rang);
      for (const poste of postes) {
        const reponse = await repondreDepuisLePoste(request, seance, poste, {
          questionId: quiz[tour].activiteId,
          valeur: 'o1',
        });
        statuts.push(reponse.status());
      }
    }
    expect(statuts).toHaveLength((CAPACITE - NAVIGATEURS) * REPONSES_PAR_POSTE);
    expect(statuts.filter((statut) => statut !== 201)).toEqual([]);

    for (const page of pages) {
      await page.locator('app-slide-quiz button.slide-quiz__option').first().click();
      await expect(page.getByTestId('etudiant-verdict')).toHaveCount(1);
    }

    const bilan = (await lireLesResultats(request, jeton, seance.sessionId)) as unknown as {
      resultats: { participants: number; questions: readonly { total: number }[] };
    };
    expect(bilan.resultats.participants).toBe(CAPACITE);

    await Promise.all(pages.map((page) => page.context().close()));
  });
});
