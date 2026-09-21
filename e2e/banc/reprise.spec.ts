import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import {
  coursReleve,
  envoyerUneReponseLibre,
  identiteDuPoste,
  inscrireUnPoste,
  lireMonEtat,
  optionsDuPoste,
  rejoindreDansLeNavigateur,
  repondreDepuisLePoste,
  seanceDemarreeSurLEcran,
  seancePartagee,
  servirLEcran,
  verdictDuPoste,
} from './contexte';
import type { EcranDuCours, SeanceOuverte } from './contexte';

const FAMILLES_SANS_PRODUCTION_DU_POSTE = ['jalons', 'enigmes', 'defis'] as const;

const REPONSE_LIBRE_ATTENDUE = 'Unité, période et source à vérifier.';

interface EtatDuPoste {
  readonly participantId: string;
  readonly reponses: readonly { readonly questionId: string; readonly valeur: string }[];
  readonly reponsesLibres: readonly {
    readonly activityId: string;
    readonly response: string;
  }[];
  readonly jalons: readonly unknown[];
  readonly enigmes: readonly unknown[];
  readonly defis: readonly unknown[];
  readonly rappels: { readonly questionIds: readonly string[] };
}

let vote: EcranDuCours;
let reflexion: EcranDuCours;

async function seanceDuFichier(request: APIRequestContext): Promise<SeanceOuverte> {
  return seancePartagee('reprise', async () => {
    const { votes, reflexions } = await coursReleve(request);
    vote = votes[0];
    const suivante = reflexions.find((ecran) => ecran.rang > vote.rang);
    expect(suivante, 'aucune réflexion après le premier vote').toBeDefined();
    reflexion = suivante!;
    return seanceDemarreeSurLEcran(request, vote.rang);
  });
}

test.describe('Banc — reprise après rechargement', () => {
  test.beforeEach(async ({ request }) => {
    const { seance, jeton } = await seanceDuFichier(request);
    await servirLEcran(request, jeton, seance.sessionId, vote.rang);
  });

  test('le poste rechargé retrouve sa séance et une seconde réponse est refusée', async ({
    page,
    request,
  }) => {
    const { seance } = await seanceDuFichier(request);
    const identite = identiteDuPoste(1);

    const poste = await rejoindreDansLeNavigateur(page, seance, identite);
    await expect(optionsDuPoste(page).first()).toBeVisible();
    await optionsDuPoste(page).first().click();

    await expect(verdictDuPoste(page)).toHaveAttribute('data-etat', /confirme|a-revoir/);

    const avant = (await lireMonEtat(request, seance, poste)) as unknown as EtatDuPoste;
    expect(avant.reponses.map((reponse) => reponse.questionId)).toEqual([vote.activiteId]);

    await page.reload();
    const repris = await rejoindreDansLeNavigateur(page, seance, identite);
    expect(repris.participantId).toBe(poste.participantId);
    await expect(optionsDuPoste(page).first()).toBeVisible();

    const relu = (await lireMonEtat(request, seance, repris)) as unknown as EtatDuPoste;
    expect(relu.reponses).toEqual(avant.reponses);

    const refus = await repondreDepuisLePoste(request, seance, repris, {
      questionId: vote.activiteId,
      valeur: vote.options[1],
    });
    expect(refus.status()).toBe(409);
    expect(((await refus.json()) as { code: string }).code).toBe('REPONSE_DEJA_ENREGISTREE');

    const apres = (await lireMonEtat(request, seance, repris)) as unknown as EtatDuPoste;
    expect(apres.reponses).toEqual(avant.reponses);
  });

  test('le contrat de reprise rend au poste ce qu il a réellement produit', async ({ request }) => {
    const { seance, jeton } = await seanceDuFichier(request);
    const poste = await inscrireUnPoste(request, seance, 2);

    const repondue = await repondreDepuisLePoste(request, seance, poste, {
      questionId: vote.activiteId,
      valeur: vote.options[0],
    });
    expect(repondue.status(), await repondue.text()).toBe(201);

    await servirLEcran(request, jeton, seance.sessionId, reflexion.rang);
    const libre = await envoyerUneReponseLibre(request, seance, poste, reflexion);
    expect(libre.status(), await libre.text()).toBe(201);
    await servirLEcran(request, jeton, seance.sessionId, vote.rang);

    const etat = (await lireMonEtat(request, seance, poste)) as unknown as EtatDuPoste;

    expect(etat.reponses).toEqual([
      expect.objectContaining({ questionId: vote.activiteId, valeur: vote.options[0] }),
    ]);
    expect(etat.reponsesLibres).toEqual([
      { activityId: reflexion.activiteId, response: REPONSE_LIBRE_ATTENDUE },
    ]);
    for (const famille of FAMILLES_SANS_PRODUCTION_DU_POSTE) {
      expect(etat[famille], `famille ${famille}`).toEqual([]);
    }
    expect(etat.rappels).toEqual({ questionIds: [] });
    expect(etat.participantId).toBe(poste.participantId);
  });
});
