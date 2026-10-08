import { expect, test } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';
import {
  CODE_DU_COURS,
  coursReleve,
  envoyerUneReponseLibre,
  identiteDuPoste,
  inscrireUnPoste,
  lireDepuisLePoste,
  rejoindreDansLeNavigateur,
  seanceDemarreeSurLEcran,
  seancePartagee,
  servirLEcran,
} from './contexte';
import type { NatureLibre, ReponseLibreDuCours, SeanceOuverte } from './contexte';

const TEXTE_LIBRE = 'Mesure, unité, période et source avant toute conclusion.';

const NATURES_LIBRES: readonly NatureLibre[] = ['reflection', 'fp-pro'];

const POSTE_HORS_LIGNE: Readonly<Record<NatureLibre, number>> = { reflection: 4, 'fp-pro': 9 };

let reponsesLibres: readonly ReponseLibreDuCours[];

let rappelsEspaces = 0;

let ecransDuCours = 0;

async function seanceDuFichier(request: APIRequestContext): Promise<SeanceOuverte> {
  return seancePartagee('ecran-non-servi', async () => {
    const releve = await coursReleve(request);
    reponsesLibres = releve.reponsesLibres;
    rappelsEspaces = releve.rappelsEspaces.length;
    ecransDuCours = releve.total;
    return seanceDemarreeSurLEcran(request, reponsesLibres[0].rang);
  });
}

async function ecrireHorsLigne(page: Page, nature: NatureLibre): Promise<void> {
  const contenu = page.getByTestId('cours-contenu');
  if (nature === 'reflection') {
    const reflexion = contenu.locator('app-slide-reflection');
    await reflexion.locator('textarea').fill(TEXTE_LIBRE);
    await reflexion.getByRole('button', { name: 'Garder cette réflexion' }).click();
    await expect(page.getByTestId('slide-reflection-etat')).toHaveAttribute(
      'data-etat',
      'attente_reseau',
    );
    return;
  }
  const pro = contenu.locator('fp-pro');
  const champs = pro.locator('textarea[data-question]');
  for (let rang = 0; rang < (await champs.count()); rang += 1) {
    await champs.nth(rang).fill(TEXTE_LIBRE);
  }
  await pro.locator('[data-testid="valider"]').click();
}

test.describe('Banc — écran non servi', () => {
  test.beforeEach(async ({ request }) => {
    const { seance, jeton } = await seanceDuFichier(request);
    await servirLEcran(request, jeton, seance.sessionId, reponsesLibres[0].rang);
  });

  test('toute réponse libre hors de l’écran servi est refusée par le serveur', async ({
    request,
  }) => {
    const { seance, jeton } = await seanceDuFichier(request);
    const poste = await inscrireUnPoste(request, seance, 3);

    const servie = await envoyerUneReponseLibre(request, seance, poste, reponsesLibres[0]);
    expect(servie.status(), await servie.text()).toBe(201);

    await servirLEcran(request, jeton, seance.sessionId, 0);
    const retardataire = await inscrireUnPoste(request, seance, 8);
    for (const ecran of reponsesLibres) {
      const refus = await envoyerUneReponseLibre(request, seance, retardataire, ecran);
      expect(refus.status(), `${ecran.id} devrait être refusé`).toBe(404);
      const corps = (await refus.json()) as { code: string; detail: string };
      expect(corps.code).toBe('ECRAN_NON_SERVI');
      expect(corps.detail).toContain(ecran.id);
    }
  });

  test('les rappels espacés restent fermés tant que leur écran n’est pas projeté', async ({
    request,
  }) => {
    const { seance } = await seanceDuFichier(request);
    test.skip(rappelsEspaces === 0, `le ${CODE_DU_COURS} ne pose aucun rappel espacé`);
    const poste = await inscrireUnPoste(request, seance, 5);

    const reponse = await lireDepuisLePoste(request, seance, poste, 'rappels');

    expect(reponse.status(), await reponse.text()).toBe(404);
    expect(((await reponse.json()) as { code: string }).code).toBe('ECRAN_NON_SERVI');
  });

  test('les rappels espacés s’ouvrent dès que le formateur projette leur écran', async ({
    request,
  }) => {
    const { seance, jeton } = await seanceDuFichier(request);
    test.skip(rappelsEspaces === 0, `le ${CODE_DU_COURS} ne pose aucun rappel espacé`);
    const poste = await inscrireUnPoste(request, seance, 7);
    await servirLEcran(request, jeton, seance.sessionId, ecransDuCours - 1);

    const reponse = await lireDepuisLePoste(request, seance, poste, 'rappels');

    expect(reponse.status(), await reponse.text()).toBe(200);
    const { questions } = (await reponse.json()) as {
      questions: readonly { questionId: string; options: readonly unknown[] }[];
    };
    expect(questions.length).toBeGreaterThan(0);
    for (const question of questions) {
      expect(question.options.length).toBeGreaterThan(1);
    }
  });

  test('le poste n’offre aucune navigation au-delà de l’écran servi', async ({ page, request }) => {
    const { seance } = await seanceDuFichier(request);

    await rejoindreDansLeNavigateur(page, seance, identiteDuPoste(6));

    await expect(page.getByTestId('etudiant-progression')).toHaveText(
      `${reponsesLibres[0].rang + 1} / ${ecransDuCours}`,
    );
    await expect(page.getByTestId('etudiant-suivant')).toHaveCount(0);
  });

  for (const nature of NATURES_LIBRES) {
    test(`le poste garde la réponse libre ${nature} et affiche le refus au retour du réseau`, async ({
      page,
      request,
    }) => {
      const { seance, jeton } = await seanceDuFichier(request);
      const libre = reponsesLibres.find((candidate) => candidate.nature === nature);
      test.skip(libre === undefined, `le ${CODE_DU_COURS} ne pose aucune réponse libre ${nature}`);
      const { rang } = libre as ReponseLibreDuCours;
      await servirLEcran(request, jeton, seance.sessionId, rang);
      await rejoindreDansLeNavigateur(page, seance, identiteDuPoste(POSTE_HORS_LIGNE[nature]));

      await page.context().setOffline(true);
      await ecrireHorsLigne(page, nature);
      await expect(page.getByTestId('etudiant-reflexion-en-attente')).toHaveAttribute(
        'data-etat',
        'attente_reseau',
      );

      await servirLEcran(request, jeton, seance.sessionId, 0);
      await page.context().setOffline(false);

      await expect(page.getByTestId('etudiant-reflexion-en-attente')).toHaveAttribute(
        'data-etat',
        'ecran_non_servi',
      );
    });
  }
});
