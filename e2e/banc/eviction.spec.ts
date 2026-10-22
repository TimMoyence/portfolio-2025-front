import { expect, test } from '@playwright/test';
import {
  agirSurLePoste,
  autreReponseQue,
  demanderUnePlace,
  identiteDuPoste,
  inscrireUnPoste,
  lireDepuisLePoste,
  lireLesResultats,
  optionsDuPoste,
  rejoindreDansLeNavigateur,
  repondreDepuisLePoste,
  seanceLimiteeSurLePremierVote,
  voterDepuisLePoste,
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
    const { releve, vote, seance, jeton } = await seanceLimiteeSurLePremierVote(request, CAPACITE);
    const autre = autreReponseQue(releve, vote.activiteId);

    const evince = await rejoindreDansLeNavigateur(page, seance, identiteDuPoste(30));
    await expect(optionsDuPoste(page).first()).toBeVisible();
    await voterDepuisLePoste(page, vote);

    await inscrireUnPoste(request, seance, 31);
    await inscrireUnPoste(request, seance, 32);

    const complete = await demanderUnePlace(request, seance, identiteDuPoste(33));
    expect(complete.status()).toBe(409);
    expect(((await complete.json()) as { code: string }).code).toBe('SEANCE_COMPLETE');

    expect(await agirSurLePoste(request, jeton, { seance, poste: evince }, 'eviction')).toBe(204);

    const apres = await lireDepuisLePoste(request, seance, evince, 'moi');
    expect(apres.status()).toBe(403);
    expect(((await apres.json()) as { code: string }).code).toBe('PARTICIPANT_EVINCE');

    const refus = await repondreDepuisLePoste(request, seance, evince, {
      questionId: autre.questionId,
      valeur: autre.valeur,
    });
    expect(refus.status()).toBe(403);

    const remplacant = await inscrireUnPoste(request, seance, 34);
    expect(remplacant.participantId).not.toBe(evince.participantId);

    const bilan = (await lireLesResultats(request, jeton, seance.sessionId)) as unknown as Bilan;
    expect(bilan.participants.map((candidat) => candidat.nom)).not.toContain(evince.identite.nom);
    const comptee = bilan.resultats.questions.find(
      (question) => question.questionId === vote.activiteId,
    );
    expect(comptee?.total).toBe(1);
  });

  test('le formateur réadmet le poste évincé par erreur, qui retrouve sa place et ses réponses', async ({
    request,
  }) => {
    const { vote, seance, jeton } = await seanceLimiteeSurLePremierVote(request, CAPACITE);
    const poste = await inscrireUnPoste(request, seance, 40);
    await repondreDepuisLePoste(request, seance, poste, {
      questionId: vote.activiteId,
      valeur: vote.options[0],
    });
    expect(await agirSurLePoste(request, jeton, { seance, poste }, 'eviction')).toBe(204);

    expect(await agirSurLePoste(request, jeton, { seance, poste }, 'readmission')).toBe(204);

    const apres = await lireDepuisLePoste(request, seance, poste, 'moi');
    expect(apres.status()).toBe(200);
    const bilan = (await lireLesResultats(request, jeton, seance.sessionId)) as unknown as Bilan;
    expect(bilan.participants.map((candidat) => candidat.nom)).toContain(poste.identite.nom);
  });
});
