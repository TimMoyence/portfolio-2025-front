import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import {
  EN_TETE_JETON,
  URL_API,
  ecransDuRenderer,
  envoyerUneReponseLibre,
  identiteDuPoste,
  inscrireUnPoste,
  lireLeCatalogue,
  rejoindreDansLeNavigateur,
  seanceDemarreeSurLEcran,
  seancePartagee,
  servirLEcran,
} from './contexte';
import type { EcranDuCours, SeanceOuverte } from './contexte';

const TEXTE_DE_REFLEXION = 'Mesure, unité, période et source avant toute conclusion.';

const ECRANS_DU_COURS = 72;

let reflexions: readonly EcranDuCours[];

async function seanceDuFichier(request: APIRequestContext): Promise<SeanceOuverte> {
  return seancePartagee('ecran-non-servi', async () => {
    reflexions = ecransDuRenderer(await lireLeCatalogue(request), 'reflection');
    expect(reflexions.length).toBeGreaterThan(1);
    return seanceDemarreeSurLEcran(request, reflexions[0].rang);
  });
}

test.describe('Banc — écran non servi', () => {
  test.beforeEach(async ({ request }) => {
    const { seance, jeton } = await seanceDuFichier(request);
    await servirLEcran(request, jeton, seance.sessionId, reflexions[0].rang);
  });

  test('toute réflexion au-delà de l’écran servi est refusée par le serveur', async ({
    request,
  }) => {
    const { seance } = await seanceDuFichier(request);
    const poste = await inscrireUnPoste(request, seance, 3);

    const servie = await envoyerUneReponseLibre(request, seance, poste, reflexions[0]);
    expect(servie.status(), await servie.text()).toBe(201);

    for (const ecran of reflexions.slice(1)) {
      const refus = await envoyerUneReponseLibre(request, seance, poste, ecran);
      expect(refus.status(), `${ecran.id} devrait être refusé`).toBe(409);
      const corps = (await refus.json()) as { code: string; detail: string };
      expect(corps.code).toBe('ECRAN_NON_SERVI');
      expect(corps.detail).toContain(ecran.id);
    }
  });

  test('la version publiée ne sert aucun écran de rappel espacé', async ({ request }) => {
    const { seance } = await seanceDuFichier(request);
    const poste = await inscrireUnPoste(request, seance, 5);

    const reponse = await request.get(
      `${URL_API}/formations/sessions/${seance.sessionId}/rappels`,
      { headers: { [EN_TETE_JETON]: poste.jeton } },
    );

    expect(reponse.status()).toBe(404);
    expect(((await reponse.json()) as { detail: string }).detail).toContain(
      'Aucun écran de rappel espacé',
    );
  });

  test('le poste n’offre aucune navigation au-delà de l’écran servi', async ({ page, request }) => {
    const { seance } = await seanceDuFichier(request);

    await rejoindreDansLeNavigateur(page, seance, identiteDuPoste(6));

    await expect(page.getByTestId('etudiant-progression')).toHaveText(
      `${reflexions[0].rang + 1} / ${ECRANS_DU_COURS}`,
    );
    await expect(page.getByTestId('etudiant-suivant')).toHaveCount(0);
  });

  test('le poste garde la réflexion et affiche le refus au retour du réseau', async ({
    page,
    request,
  }) => {
    const { seance, jeton } = await seanceDuFichier(request);

    await rejoindreDansLeNavigateur(page, seance, identiteDuPoste(4));
    const reflexion = page.locator('app-slide-reflection');
    await expect(reflexion).toBeVisible();

    await page.context().setOffline(true);
    await reflexion.locator('textarea').fill(TEXTE_DE_REFLEXION);
    await reflexion.getByRole('button', { name: 'Garder cette réflexion' }).click();
    await expect(page.getByTestId('slide-reflection-etat')).toHaveAttribute(
      'data-etat',
      'attente_reseau',
    );

    await servirLEcran(request, jeton, seance.sessionId, 0);
    await page.context().setOffline(false);

    await expect(page.getByTestId('slide-reflection-etat')).toHaveAttribute(
      'data-etat',
      'ecran_non_servi',
    );
  });
});
