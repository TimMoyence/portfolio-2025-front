import { expect } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

export const URL_API = process.env['BANC_URL_API'] ?? 'http://127.0.0.1:3010/api/v1/portfolio25';

export const URL_FRONT = process.env['BANC_URL_FRONT'] ?? 'http://localhost:4010';

export const SLUG_B2 = 'b2-01-traitement-information-chiffree';

export const EN_TETE_JETON = 'x-participant-token';

const IDENTIFIANTS_FORMATEUR = {
  email: process.env['BANC_FORMATEUR_EMAIL'] ?? 'formateur.banc@example.test',
  motDePasse: process.env['BANC_FORMATEUR_MOTDEPASSE'] ?? '',
};

export interface Seance {
  readonly sessionId: string;
  readonly code: string;
}

export interface Poste {
  readonly participantId: string;
  readonly jeton: string;
  readonly identite: Identite;
}

export interface Identite {
  readonly prenom: string;
  readonly nom: string;
  readonly email: string;
}

export interface QuestionDuCours {
  readonly activiteId: string;
  readonly options: readonly string[];
}

export interface EcranDuCours extends QuestionDuCours {
  readonly rang: number;
  readonly id: string;
  readonly jumelle: QuestionDuCours | null;
}

export interface ReleveDuCours {
  readonly total: number;
  readonly questions: readonly EcranDuCours[];
  readonly votes: readonly EcranDuCours[];
  readonly reflexions: readonly EcranDuCours[];
}

const RANG_DU_RELEVE = 90;

const PRENOMS = ['Lea', 'Noe', 'Ines', 'Youn', 'Mila', 'Sacha', 'Anouk'];

export function identiteDuPoste(rang: number): Identite {
  return {
    prenom: PRENOMS[rang % PRENOMS.length],
    nom: `Poste${rang}`,
    email: `poste${rang}@example.test`,
  };
}

let jetonPartage: Promise<string> | null = null;

async function ouvrirUneSession(request: APIRequestContext): Promise<string> {
  const reponse = await request.post(`${URL_API}/auth/login`, {
    data: {
      email: IDENTIFIANTS_FORMATEUR.email,
      password: IDENTIFIANTS_FORMATEUR.motDePasse,
    },
  });
  expect(reponse.status(), await reponse.text()).toBe(201);
  const { accessToken } = (await reponse.json()) as { accessToken: string };
  return accessToken;
}

let jetonCourant = process.env['BANC_JETON_FORMATEUR'] ?? '';

export function jetonDuFormateur(request: APIRequestContext): Promise<string> {
  if (jetonCourant !== '') {
    return Promise.resolve(jetonCourant);
  }
  jetonPartage ??= ouvrirUneSession(request).then((jeton) => {
    jetonCourant = jeton;
    jetonPartage = null;
    return jeton;
  });
  return jetonPartage;
}

function entetesDuFormateur(jeton: string): Record<string, string> {
  return { authorization: `Bearer ${jeton}` };
}

async function ouvrirUneSeance(
  request: APIRequestContext,
  jeton: string,
  corps: Readonly<Record<string, unknown>> = {},
): Promise<Seance> {
  const demander = (autorisation: string): Promise<import('@playwright/test').APIResponse> =>
    request.post(`${URL_API}/formations/sessions`, {
      headers: entetesDuFormateur(autorisation),
      data: { courseSlug: SLUG_B2, ...corps },
    });
  let reponse = await demander(jeton);
  if (reponse.status() === 401) {
    jetonCourant = '';
    reponse = await demander(await jetonDuFormateur(request));
  }
  expect(reponse.status(), await reponse.text()).toBe(201);
  return (await reponse.json()) as Seance;
}

async function demarrerLaSeance(
  request: APIRequestContext,
  jeton: string,
  sessionId: string,
): Promise<void> {
  const reponse = await request.post(`${URL_API}/formations/sessions/${sessionId}/start`, {
    headers: entetesDuFormateur(jeton),
  });
  expect(reponse.status(), await reponse.text()).toBe(204);
}

export async function servirLEcran(
  request: APIRequestContext,
  jeton: string,
  sessionId: string,
  ecran: number,
): Promise<void> {
  const reponse = await request.patch(`${URL_API}/formations/sessions/${sessionId}/control`, {
    headers: entetesDuFormateur(jeton),
    data: { ecran },
  });
  expect(reponse.status(), await reponse.text()).toBe(204);
}

export async function lireLesResultats(
  request: APIRequestContext,
  jeton: string,
  sessionId: string,
): Promise<Record<string, unknown>> {
  const reponse = await request.get(`${URL_API}/formations/sessions/${sessionId}/results`, {
    headers: entetesDuFormateur(jeton),
  });
  expect(reponse.status(), await reponse.text()).toBe(200);
  return (await reponse.json()) as Record<string, unknown>;
}

export async function evincerLePoste(
  request: APIRequestContext,
  jeton: string,
  sessionId: string,
  participantId: string,
): Promise<number> {
  const reponse = await request.delete(
    `${URL_API}/formations/sessions/${sessionId}/participants/${participantId}`,
    { headers: entetesDuFormateur(jeton) },
  );
  return reponse.status();
}

export async function readmettreLePoste(
  request: APIRequestContext,
  jeton: string,
  sessionId: string,
  participantId: string,
): Promise<number> {
  const reponse = await request.post(
    `${URL_API}/formations/sessions/${sessionId}/participants/${participantId}/readmission`,
    { headers: entetesDuFormateur(jeton), data: {} },
  );
  return reponse.status();
}

export async function inscrireUnPoste(
  request: APIRequestContext,
  seance: Seance,
  rang: number,
): Promise<Poste> {
  const identite = identiteDuPoste(rang);
  const reponse = await request.post(`${URL_API}/formations/sessions/${seance.code}/join`, {
    data: identite,
  });
  expect(reponse.status(), await reponse.text()).toBe(201);
  const { participantId, jeton } = (await reponse.json()) as {
    participantId: string;
    jeton: string;
  };
  return { participantId, jeton, identite };
}

export function repondreDepuisLePoste(
  request: APIRequestContext,
  seance: Seance,
  poste: Poste,
  reponse: { readonly questionId: string; readonly valeur: string | number },
): Promise<import('@playwright/test').APIResponse> {
  return request.post(`${URL_API}/formations/sessions/${seance.sessionId}/answers`, {
    headers: { [EN_TETE_JETON]: poste.jeton },
    data: { ...reponse, dureeMs: 900 },
  });
}

export function envoyerUneReponseLibre(
  request: APIRequestContext,
  seance: Seance,
  poste: Poste,
  ecran: EcranDuCours,
): Promise<import('@playwright/test').APIResponse> {
  return request.post(`${URL_API}/formations/sessions/${seance.sessionId}/free-responses`, {
    headers: { [EN_TETE_JETON]: poste.jeton },
    data: {
      screenId: ecran.id,
      activityId: ecran.activiteId,
      response: 'Unité, période et source à vérifier.',
      dureeMs: 4000,
    },
  });
}

export async function lireMonEtat(
  request: APIRequestContext,
  seance: Seance,
  poste: Poste,
): Promise<Record<string, unknown>> {
  const reponse = await request.get(`${URL_API}/formations/sessions/${seance.sessionId}/moi`, {
    headers: { [EN_TETE_JETON]: poste.jeton },
  });
  expect(reponse.status(), await reponse.text()).toBe(200);
  return (await reponse.json()) as Record<string, unknown>;
}

export function lireLeSujet(
  request: APIRequestContext,
  seance: Seance,
  poste: Poste,
): Promise<import('@playwright/test').APIResponse> {
  return request.get(`${URL_API}/formations/sessions/${seance.sessionId}/sujet`, {
    headers: { [EN_TETE_JETON]: poste.jeton },
  });
}

interface QuestionDuSujet {
  readonly id: string;
  readonly options?: readonly { readonly id: string }[];
}

interface EcranDuSujet {
  readonly id: string;
  readonly type: string;
  readonly donnees: {
    readonly question?: QuestionDuSujet;
    readonly questionJumelle?: QuestionDuSujet;
    readonly questions?: readonly {
      readonly donnees: { readonly question?: QuestionDuSujet };
    }[];
    readonly recit?: {
      readonly presentation?: {
        readonly renderer: string;
        readonly props: { readonly promptData?: { readonly id: string } };
      };
    };
  };
}

function questionsDeLEcran(ecran: EcranDuSujet): readonly QuestionDuSujet[] {
  const imbriquees = (ecran.donnees.questions ?? []).flatMap((entree) =>
    entree.donnees.question === undefined ? [] : [entree.donnees.question],
  );
  const directe = ecran.donnees.question;
  return directe === undefined ? imbriquees : [directe, ...imbriquees];
}

function questionDuCours(question: QuestionDuSujet): QuestionDuCours {
  return {
    activiteId: question.id,
    options: (question.options ?? []).map((option) => option.id),
  };
}

function classer(ecrans: readonly EcranDuSujet[]): ReleveDuCours {
  const questions: EcranDuCours[] = [];
  const votes: EcranDuCours[] = [];
  const reflexions: EcranDuCours[] = [];
  ecrans.forEach((ecran, rang) => {
    const jumelle = ecran.donnees.questionJumelle;
    for (const question of questionsDeLEcran(ecran)) {
      const posee = questionDuCours(question);
      if (posee.options.length === 0) continue;
      const trouvee = {
        rang,
        id: ecran.id,
        ...posee,
        jumelle:
          jumelle === undefined || question !== ecran.donnees.question
            ? null
            : questionDuCours(jumelle),
      };
      questions.push(trouvee);
      if (ecran.type === 'fp-vote') votes.push(trouvee);
    }
    const presentation = ecran.donnees.recit?.presentation;
    const invite = presentation?.props.promptData;
    if (presentation?.renderer === 'reflection' && invite !== undefined) {
      reflexions.push({
        rang,
        id: ecran.id,
        activiteId: invite.id,
        options: [],
        jumelle: null,
      });
    }
  });
  return { total: ecrans.length, questions, votes, reflexions };
}

async function relever(request: APIRequestContext): Promise<ReleveDuCours> {
  const catalogue = await request.get(`${URL_API}/formations/catalogue/${SLUG_B2}`);
  expect(catalogue.status(), await catalogue.text()).toBe(200);
  const { ecrans } = (await catalogue.json()) as { ecrans: readonly unknown[] };

  const jeton = await jetonDuFormateur(request);
  const seance = await ouvrirUneSeance(request, jeton);
  await demarrerLaSeance(request, jeton, seance.sessionId);
  await servirLEcran(request, jeton, seance.sessionId, ecrans.length - 1);
  const poste = await inscrireUnPoste(request, seance, RANG_DU_RELEVE);

  const reponse = await lireLeSujet(request, seance, poste);
  expect(reponse.status(), await reponse.text()).toBe(200);
  const sujet = (await reponse.json()) as { ecrans: readonly EcranDuSujet[] };
  const releve = classer(sujet.ecrans);
  expect(releve.total).toBe(ecrans.length);
  expect(releve.votes.length, 'aucun vote dans la version publiée').toBeGreaterThan(1);
  expect(releve.reflexions.length, 'aucune réflexion dans la version publiée').toBeGreaterThan(1);
  return releve;
}

let releveDuCours: Promise<ReleveDuCours> | null = null;

export function coursReleve(request: APIRequestContext): Promise<ReleveDuCours> {
  releveDuCours ??= relever(request);
  return releveDuCours;
}

export async function posteDansSonNavigateur(
  browser: import('@playwright/test').Browser,
  seance: Seance,
  rang: number,
): Promise<Page> {
  const contexte = await browser.newContext({ baseURL: URL_FRONT, locale: 'fr-FR' });
  const page = await contexte.newPage();
  await rejoindreDansLeNavigateur(page, seance, identiteDuPoste(rang));
  return page;
}

export function optionsDuPoste(page: Page): import('@playwright/test').Locator {
  return page.locator('[data-testid="slide-activity-host"] [data-testid="option"]');
}

export function verdictDuPoste(page: Page): import('@playwright/test').Locator {
  return page.locator('[data-testid="slide-activity-host"] [data-testid="verdict"]');
}

export function phaseDuPoste(page: Page): import('@playwright/test').Locator {
  return page.locator('[data-testid="slide-activity-host"] [data-testid="phase"]');
}

export async function connecterLeFormateur(page: Page): Promise<void> {
  await page.goto('/fr/login');
  await page.locator('#auth-trigger-log-in').click();
  await page.locator('#auth-tab-log-in #login-email').fill(IDENTIFIANTS_FORMATEUR.email);
  await page.locator('#auth-tab-log-in #login-password').fill(IDENTIFIANTS_FORMATEUR.motDePasse);
  await page.locator('#auth-tab-log-in button[type="submit"]').click();
  await expect(page).toHaveURL(/\/(fr\/)?$/);
}

export async function rejoindreDansLeNavigateur(
  page: Page,
  seance: Seance,
  identite: Identite,
): Promise<Poste> {
  await page.goto('/fr/cours/rejoindre');
  await page.getByLabel('Code de la séance').fill(seance.code);
  await page.getByLabel('Prénom').fill(identite.prenom);
  await page.getByLabel('Nom', { exact: true }).fill(identite.nom);
  await page.getByLabel('Adresse e-mail').fill(identite.email);
  const inscription = page.waitForResponse(
    (reponse) => reponse.url().endsWith('/join') && reponse.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Entrer dans la séance' }).click();
  const { participantId, jeton } = (await (await inscription).json()) as {
    participantId: string;
    jeton: string;
  };
  await expect(page.getByTestId('etudiant-seance')).toBeVisible();
  return { participantId, jeton, identite };
}

export interface SeanceOuverte {
  readonly seance: Seance;
  readonly jeton: string;
}

export async function seanceDemarreeSurLEcran(
  request: APIRequestContext,
  ecran: number,
  corps: Readonly<Record<string, unknown>> = {},
): Promise<SeanceOuverte> {
  const seance = await ouvrirUneSeance(request, await jetonDuFormateur(request), corps);
  const jeton = await jetonDuFormateur(request);
  await demarrerLaSeance(request, jeton, seance.sessionId);
  await servirLEcran(request, jeton, seance.sessionId, ecran);
  return { seance, jeton };
}

const partagees = new Map<string, Promise<SeanceOuverte>>();

export function seancePartagee(
  cle: string,
  fabriquer: () => Promise<SeanceOuverte>,
): Promise<SeanceOuverte> {
  const connue = partagees.get(cle);
  if (connue !== undefined) return connue;
  const ouverte = fabriquer();
  partagees.set(cle, ouverte);
  return ouverte;
}
