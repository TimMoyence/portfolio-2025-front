import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  URL_API,
  coursReleve,
  identiteDuPoste,
  inscrireUnPoste,
  lireLeSujet,
  lireLesResultats,
  optionsDuPoste,
  posteDansSonNavigateur,
  repondreDepuisLePoste,
  seanceDemarreeSurLEcran,
  servirLEcran,
  verdictDuPoste,
} from './contexte';

const CAPACITE = 35;

const LIMITE_SUJET_PAR_PARTICIPANT = 180;

const NAVIGATEURS = 3;

const REPONSES_PAR_POSTE = 2;

const PREMIER_RANG = 100;

test.describe('Banc — salle chargée derrière une seule adresse', () => {
  test('trente-cinq postes rejoignent, le trente-sixième est refusé, le débit suit le jeton', async ({
    browser,
    request,
  }) => {
    const { votes, total } = await coursReleve(request);
    const { seance, jeton } = await seanceDemarreeSurLEcran(request, votes[0].rang, {
      capacite: CAPACITE,
    });

    const pages: Page[] = [];
    for (let rang = 0; rang < NAVIGATEURS; rang += 1) {
      pages.push(await posteDansSonNavigateur(browser, seance, PREMIER_RANG + rang));
    }
    for (const page of pages) {
      await expect(optionsDuPoste(page).first()).toBeVisible();
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
      await servirLEcran(request, jeton, seance.sessionId, votes[tour].rang);
      for (const poste of postes) {
        const reponse = await repondreDepuisLePoste(request, seance, poste, {
          questionId: votes[tour].activiteId,
          valeur: votes[tour].options[0],
        });
        statuts.push(reponse.status());
      }
    }
    expect(statuts).toHaveLength((CAPACITE - NAVIGATEURS) * REPONSES_PAR_POSTE);
    expect(statuts.filter((statut) => statut !== 201)).toEqual([]);

    const [bride, voisin] = postes;
    const statutsDuBride: number[] = [];
    for (let appel = 0; appel <= LIMITE_SUJET_PAR_PARTICIPANT; appel += 1) {
      statutsDuBride.push((await lireLeSujet(request, seance, bride)).status());
    }
    expect(statutsDuBride.slice(0, LIMITE_SUJET_PAR_PARTICIPANT)).toEqual(
      Array.from({ length: LIMITE_SUJET_PAR_PARTICIPANT }, () => 200),
    );
    expect(statutsDuBride[LIMITE_SUJET_PAR_PARTICIPANT]).toBe(429);
    expect((await lireLeSujet(request, seance, voisin)).status()).toBe(200);

    const dernierVote = votes[REPONSES_PAR_POSTE - 1];
    for (const page of pages) {
      await expect(page.getByTestId('etudiant-progression')).toHaveText(
        `${dernierVote.rang + 1} / ${total}`,
      );
      await optionsDuPoste(page).first().click();
      await expect(verdictDuPoste(page)).toHaveCount(1);
    }

    const bilan = (await lireLesResultats(request, jeton, seance.sessionId)) as unknown as {
      resultats: { participants: number; questions: readonly { total: number }[] };
    };
    expect(bilan.resultats.participants).toBe(CAPACITE);

    await Promise.all(pages.map((page) => page.context().close()));
  });
});
