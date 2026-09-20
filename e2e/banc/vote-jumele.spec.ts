import { expect, test } from '@playwright/test';
import type { APIRequestContext, APIResponse, Page } from '@playwright/test';
import {
  URL_API,
  ecransDuRenderer,
  inscrireUnPoste,
  lireLeCatalogue,
  lireLesResultats,
  posteDansSonNavigateur,
  repondreDepuisLePoste,
  seanceDemarreeSurLEcran,
  seancePartagee,
  servirLEcran,
} from './contexte';
import type { EcranDuCours, SeanceOuverte } from './contexte';

const PAIRE_DE_VOTE = ['b2-s46-peer-vote-1', 'b2-s48-peer-vote-2'] as const;

const PHASES = ['vote', 'discussion', 'revote', 'revele'] as const;

interface QuestionDesResultats {
  readonly questionId: string;
  readonly total: number;
  readonly parOption: Readonly<Record<string, number>>;
}

let principale: EcranDuCours;

let jumelle: EcranDuCours;

function ecranDeVote(ecrans: readonly EcranDuCours[], questionId: string): EcranDuCours {
  const trouve = ecrans.find((ecran) => ecran.activiteId === questionId);
  expect(trouve, `écran de vote ${questionId} absent de la version publiée`).toBeDefined();
  return trouve as EcranDuCours;
}

async function seanceDuFichier(request: APIRequestContext): Promise<SeanceOuverte> {
  return seancePartagee('vote-jumele', async () => {
    const quiz = ecransDuRenderer(await lireLeCatalogue(request), 'quiz');
    principale = ecranDeVote(quiz, PAIRE_DE_VOTE[0]);
    jumelle = ecranDeVote(quiz, PAIRE_DE_VOTE[1]);
    return seanceDemarreeSurLEcran(request, principale.rang);
  });
}

function voterDans(page: Page, option: number): Promise<void> {
  return page.locator('app-slide-quiz button.slide-quiz__option').nth(option).click();
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
    await expect(premier.getByTestId('etudiant-verdict')).toHaveCount(1);
    await expect(second.getByTestId('etudiant-verdict')).toHaveCount(1);

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

  test('refuse en 404 le vote de la jumelle tant que son écran n’est pas projeté', async ({
    request,
  }) => {
    const { seance } = await seanceDuFichier(request);
    expect(jumelle.rang).toBeGreaterThan(principale.rang);
    const poste = await inscrireUnPoste(request, seance, 13);

    const avant = await repondreDepuisLePoste(request, seance, poste, {
      questionId: jumelle.activiteId,
      valeur: 'o1',
    });

    expect(avant.status(), await avant.text()).toBe(404);
    expect(((await avant.json()) as { code: string }).code).toBe('ECRAN_NON_SERVI');
  });

  test('la version publiée refuse tout pilotage de phase et toute révélation', async ({
    request,
  }) => {
    const { seance, jeton } = await seanceDuFichier(request);

    for (const phase of PHASES) {
      const refus = await piloterLaPhase(request, jeton, seance.sessionId, {
        screenId: principale.id,
        phase,
      });
      expect(refus.status(), `phase ${phase}`).toBe(400);
      expect(((await refus.json()) as { detail: string }).detail).toContain(
        'seul un vote à question jumelle porte des phases',
      );
    }

    const revelation = await piloterLaPhase(request, jeton, seance.sessionId, {
      screenId: principale.id,
      revele: true,
    });
    expect(revelation.status()).toBe(400);
    expect(((await revelation.json()) as { detail: string }).detail).toContain(
      'seul un défi porte une révélation',
    );
  });
});
