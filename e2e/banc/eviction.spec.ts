import { expect, test } from '@playwright/test';
import {
  EN_TETE_JETON,
  URL_API,
  coursReleve,
  evincerLePoste,
  identiteDuPoste,
  inscrireUnPoste,
  lireLesResultats,
  optionsDuPoste,
  readmettreLePoste,
  rejoindreDansLeNavigateur,
  repondreDepuisLePoste,
  seanceDemarreeSurLEcran,
  verdictDuPoste,
} from './contexte';

const CAPACITE = 3;

interface Bilan {
  readonly participants: readonly { readonly nom: string }[];
  readonly resultats: {
    readonly questions: readonly { readonly questionId: string; readonly total: number }[];
  };
}

test.describe('Banc — éviction en séance (AC-37)', () => {
  test('le poste évincé perd l’accès, sa place est reprise et ses réponses restent au bilan', async ({
    page,
    request,
  }) => {
    const { votes } = await coursReleve(request);
    const { seance, jeton } = await seanceDemarreeSurLEcran(request, votes[0].rang, {
      capacite: CAPACITE,
    });

    const evince = await rejoindreDansLeNavigateur(page, seance, identiteDuPoste(30));
    await expect(optionsDuPoste(page).first()).toBeVisible();
    await optionsDuPoste(page).first().click();
    await expect(verdictDuPoste(page)).toHaveCount(1);

    await inscrireUnPoste(request, seance, 31);
    await inscrireUnPoste(request, seance, 32);

    const complete = await request.post(`${URL_API}/formations/sessions/${seance.code}/join`, {
      data: identiteDuPoste(33),
    });
    expect(complete.status()).toBe(409);
    expect(((await complete.json()) as { code: string }).code).toBe('SEANCE_COMPLETE');

    expect(await evincerLePoste(request, jeton, seance.sessionId, evince.participantId)).toBe(204);

    const apres = await request.get(`${URL_API}/formations/sessions/${seance.sessionId}/moi`, {
      headers: { [EN_TETE_JETON]: evince.jeton },
    });
    expect(apres.status()).toBe(404);
    expect(((await apres.json()) as { code: string }).code).toBe('PARTICIPANT_INTROUVABLE');

    const refus = await repondreDepuisLePoste(request, seance, evince, {
      questionId: votes[1].activiteId,
      valeur: votes[1].options[0],
    });
    expect(refus.status()).toBe(404);

    const remplacant = await inscrireUnPoste(request, seance, 34);
    expect(remplacant.participantId).not.toBe(evince.participantId);

    const bilan = (await lireLesResultats(request, jeton, seance.sessionId)) as unknown as Bilan;
    expect(bilan.participants.map((candidat) => candidat.nom)).not.toContain(evince.identite.nom);
    const comptee = bilan.resultats.questions.find(
      (question) => question.questionId === votes[0].activiteId,
    );
    expect(comptee?.total).toBe(1);
  });

  test('le formateur réadmet le poste évincé par erreur, qui retrouve sa place et ses réponses', async ({
    request,
  }) => {
    const { votes } = await coursReleve(request);
    const { seance, jeton } = await seanceDemarreeSurLEcran(request, votes[0].rang, {
      capacite: CAPACITE,
    });
    const poste = await inscrireUnPoste(request, seance, 40);
    await repondreDepuisLePoste(request, seance, poste, {
      questionId: votes[0].activiteId,
      valeur: votes[0].options[0],
    });
    expect(await evincerLePoste(request, jeton, seance.sessionId, poste.participantId)).toBe(204);

    expect(await readmettreLePoste(request, jeton, seance.sessionId, poste.participantId)).toBe(
      204,
    );

    const apres = await request.get(`${URL_API}/formations/sessions/${seance.sessionId}/moi`, {
      headers: { [EN_TETE_JETON]: poste.jeton },
    });
    expect(apres.status()).toBe(200);
    const bilan = (await lireLesResultats(request, jeton, seance.sessionId)) as unknown as Bilan;
    expect(bilan.participants.map((candidat) => candidat.nom)).toContain(poste.identite.nom);
  });
});
