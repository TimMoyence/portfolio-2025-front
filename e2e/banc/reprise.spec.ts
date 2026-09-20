import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import {
  identiteDuPoste,
  inscrireUnPoste,
  lireLeCatalogue,
  lireMonEtat,
  premierEcran,
  rejoindreDansLeNavigateur,
  repondreDepuisLePoste,
  seanceDemarreeSurLEcran,
  seancePartagee,
  servirLEcran,
} from './contexte';
import type { EcranDuCours, SeanceOuverte } from './contexte';

const FAMILLES_DE_LA_REPRISE = [
  'reponses',
  'reponsesLibres',
  'jalons',
  'enigmes',
  'defis',
] as const;

interface EtatDuPoste {
  readonly reponses: readonly { readonly questionId: string; readonly valeur: string }[];
}

let quiz: EcranDuCours;

async function seanceDuFichier(request: APIRequestContext): Promise<SeanceOuverte> {
  return seancePartagee('reprise', async () => {
    quiz = premierEcran(await lireLeCatalogue(request), 'quiz');
    return seanceDemarreeSurLEcran(request, quiz.rang);
  });
}

test.describe('Banc — reprise après rechargement', () => {
  test.beforeEach(async ({ request }) => {
    const { seance, jeton } = await seanceDuFichier(request);
    await servirLEcran(request, jeton, seance.sessionId, quiz.rang);
  });

  test('le poste rechargé retrouve sa séance et une seconde réponse est refusée', async ({
    page,
    request,
  }) => {
    const { seance } = await seanceDuFichier(request);
    const identite = identiteDuPoste(1);

    const poste = await rejoindreDansLeNavigateur(page, seance, identite);
    await expect(page.locator('app-slide-quiz')).toBeVisible();
    await page.locator('app-slide-quiz button.slide-quiz__option').first().click();

    const verdict = page.getByTestId('etudiant-verdict').first();
    await expect(verdict).toHaveAttribute('data-question', quiz.activiteId);
    await expect(verdict).toHaveAttribute('data-reussite', /true|false/);

    const avant = (await lireMonEtat(request, seance, poste)) as unknown as EtatDuPoste;
    expect(avant.reponses).toHaveLength(1);

    await page.reload();
    const repris = await rejoindreDansLeNavigateur(page, seance, identite);
    expect(repris.participantId).toBe(poste.participantId);
    await expect(page.locator('app-slide-quiz')).toBeVisible();

    const relu = (await lireMonEtat(request, seance, repris)) as unknown as EtatDuPoste;
    expect(relu.reponses).toEqual(avant.reponses);

    const refus = await repondreDepuisLePoste(request, seance, repris, {
      questionId: quiz.activiteId,
      valeur: 'o2',
    });
    expect(refus.status()).toBe(409);
    expect(((await refus.json()) as { code: string }).code).toBe('REPONSE_DEJA_ENREGISTREE');

    const apres = (await lireMonEtat(request, seance, repris)) as unknown as EtatDuPoste;
    expect(apres.reponses).toEqual(avant.reponses);
  });

  test('le contrat de reprise sert toutes les familles du poste', async ({ request }) => {
    const { seance } = await seanceDuFichier(request);
    const poste = await inscrireUnPoste(request, seance, 2);

    const etat = await lireMonEtat(request, seance, poste);

    for (const famille of FAMILLES_DE_LA_REPRISE) {
      expect(Array.isArray(etat[famille]), `famille ${famille}`).toBe(true);
    }
    expect(etat['rappels']).toEqual({ questionIds: [] });
    expect(etat['participantId']).toBe(poste.participantId);
  });
});
