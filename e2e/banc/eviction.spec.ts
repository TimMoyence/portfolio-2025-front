import { expect, test } from '@playwright/test';
import {
  URL_API,
  agirSurLePoste,
  identiteDuPoste,
  inscrireUnPoste,
  lireDepuisLePoste,
  lireLesResultats,
  optionsDuPoste,
  rejoindreDansLeNavigateur,
  repondreDepuisLePoste,
  seanceLimiteeSurLePremierVote,
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
    const {
      releve: { votes },
      seance,
      jeton,
    } = await seanceLimiteeSurLePremierVote(request, CAPACITE);

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

    expect(await agirSurLePoste(request, jeton, { seance, poste: evince }, 'eviction')).toBe(204);

    const apres = await lireDepuisLePoste(request, seance, evince, 'moi');
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
    const {
      releve: { votes },
      seance,
      jeton,
    } = await seanceLimiteeSurLePremierVote(request, CAPACITE);
    const poste = await inscrireUnPoste(request, seance, 40);
    await repondreDepuisLePoste(request, seance, poste, {
      questionId: votes[0].activiteId,
      valeur: votes[0].options[0],
    });
    expect(await agirSurLePoste(request, jeton, { seance, poste }, 'eviction')).toBe(204);

    expect(await agirSurLePoste(request, jeton, { seance, poste }, 'readmission')).toBe(204);

    const apres = await lireDepuisLePoste(request, seance, poste, 'moi');
    expect(apres.status()).toBe(200);
    const bilan = (await lireLesResultats(request, jeton, seance.sessionId)) as unknown as Bilan;
    expect(bilan.participants.map((candidat) => candidat.nom)).toContain(poste.identite.nom);
  });
});
