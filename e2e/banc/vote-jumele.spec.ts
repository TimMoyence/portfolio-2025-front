import { expect, test } from '@playwright/test';
import type { APIRequestContext, APIResponse, Page } from '@playwright/test';
import {
  URL_API,
  coursReleve,
  inscrireUnPoste,
  lireLesResultats,
  optionsDuPoste,
  phaseDuPoste,
  posteDansSonNavigateur,
  repondreDepuisLePoste,
  seanceDemarreeSurLEcran,
  seancePartagee,
  servirLEcran,
  verdictDuPoste,
} from './contexte';
import type { EcranDuCours, EcranRepere, SeanceOuverte } from './contexte';

const PHASES = ['vote', 'discussion', 'revote', 'revele'] as const;

interface QuestionDesResultats {
  readonly questionId: string;
  readonly total: number;
  readonly parOption: Readonly<Record<string, number>>;
}

let principale: EcranDuCours;

let suivant: EcranDuCours;

let sansCorrige: EcranRepere;

async function seanceDuFichier(request: APIRequestContext): Promise<SeanceOuverte> {
  return seancePartagee('vote-jumele', async () => {
    const { votes, recitsSansActivite } = await coursReleve(request);
    [principale, suivant] = votes;
    expect(principale.jumelle, 'le premier vote n’a pas de question jumelle').not.toBeNull();
    [sansCorrige] = recitsSansActivite;
    return seanceDemarreeSurLEcran(request, principale.rang);
  });
}

function voterDans(page: Page, option: number): Promise<void> {
  return optionsDuPoste(page).nth(option).click();
}

function optionsAffichees(page: Page): Promise<string[]> {
  return optionsDuPoste(page).evaluateAll((boutons) =>
    boutons.map((bouton) => bouton.getAttribute('data-option') ?? ''),
  );
}

function piloterLaPhase(
  request: APIRequestContext,
  jeton: string,
  sessionId: string,
  pilotage: Readonly<Record<string, unknown>>,
): Promise<APIResponse> {
  return request.patch(`${URL_API}/formations/sessions/${sessionId}/control`, {
    headers: { authorization: `Bearer ${jeton}` },
    data: { pilotage },
  });
}

test.describe('Banc — vote à question jumelle', () => {
  test.beforeEach(async ({ request }) => {
    const { seance, jeton } = await seanceDuFichier(request);
    await servirLEcran(request, jeton, seance.sessionId, principale.rang);
  });

  test('deux navigateurs votent en même temps et le pupitre compte les deux', async ({
    browser,
    request,
  }) => {
    const { seance, jeton } = await seanceDuFichier(request);

    const premier = await posteDansSonNavigateur(browser, seance, 11);
    const second = await posteDansSonNavigateur(browser, seance, 12);

    await Promise.all([voterDans(premier, 0), voterDans(second, 1)]);
    await expect(verdictDuPoste(premier)).toHaveCount(1);
    await expect(verdictDuPoste(second)).toHaveCount(1);

    const resultats = (await lireLesResultats(request, jeton, seance.sessionId)) as unknown as {
      resultats: { questions: readonly QuestionDesResultats[] };
    };
    const question = resultats.resultats.questions.find(
      (candidate) => candidate.questionId === principale.activiteId,
    );
    expect(question?.total).toBe(2);
    expect(Object.values(question?.parOption ?? {}).reduce((somme, n) => somme + n, 0)).toBe(2);

    await Promise.all([premier.context().close(), second.context().close()]);
  });

  test('le pupitre mène les quatre phases et le poste bascule sur la jumelle au revote', async ({
    browser,
    request,
  }) => {
    const { seance, jeton } = await seanceDemarreeSurLEcran(request, principale.rang);
    const poste = await posteDansSonNavigateur(browser, seance, 14);
    const jumelle = principale.jumelle!;

    await expect(optionsDuPoste(poste).first()).toBeEnabled();
    expect(await optionsAffichees(poste)).toEqual(expect.arrayContaining([...principale.options]));

    for (const phase of PHASES) {
      const pilotee = await piloterLaPhase(request, jeton, seance.sessionId, {
        screenId: principale.id,
        phase,
      });
      expect(pilotee.status(), `phase ${phase}`).toBe(204);
      await expect(phaseDuPoste(poste)).toHaveAttribute('data-phase', phase);
      if (phase === 'discussion') {
        await expect(optionsDuPoste(poste).first()).toBeDisabled();
      }
      if (phase === 'revote') {
        expect(await optionsAffichees(poste)).toEqual(expect.arrayContaining([...jumelle.options]));
        await voterDans(poste, 0);
        await expect(optionsDuPoste(poste).first()).toBeDisabled();
      }
    }

    await expect(verdictDuPoste(poste)).toHaveAttribute('data-etat', /confirme|a-revoir/);
    await poste.context().close();
  });

  test('refuse en 404 le vote de l’écran suivant tant qu’il n’est pas projeté', async ({
    request,
  }) => {
    const { seance } = await seanceDuFichier(request);
    expect(suivant.rang).toBeGreaterThan(principale.rang);
    const poste = await inscrireUnPoste(request, seance, 13);

    const avant = await repondreDepuisLePoste(request, seance, poste, {
      questionId: suivant.activiteId,
      valeur: suivant.options[0],
    });

    expect(avant.status(), await avant.text()).toBe(404);
    expect(((await avant.json()) as { code: string }).code).toBe('ECRAN_NON_SERVI');
  });

  test('refuse une phase hors vote et une révélation hors corrigé', async ({ request }) => {
    const { seance, jeton } = await seanceDuFichier(request);

    const horsVote = await piloterLaPhase(request, jeton, seance.sessionId, {
      screenId: sansCorrige.id,
      phase: 'vote',
    });
    expect(horsVote.status(), await horsVote.text()).toBe(400);
    expect(((await horsVote.json()) as { detail: string }).detail).toContain(
      'seul un vote à question jumelle porte des phases',
    );

    const revelation = await piloterLaPhase(request, jeton, seance.sessionId, {
      screenId: sansCorrige.id,
      revele: true,
    });
    expect(revelation.status(), await revelation.text()).toBe(400);
    expect(((await revelation.json()) as { detail: string }).detail).toContain(
      'seul un écran porteur d’un corrigé se révèle',
    );
  });
});
