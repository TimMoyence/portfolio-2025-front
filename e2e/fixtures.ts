import type { Page, Route } from '@playwright/test';
import type { z } from 'zod';
import type { DonneesFpRecall } from '../contrat/types.gen';
import {
  zEtatParticipantResponseDto as etatParticipantServi,
  zJoinSessionResponseDto as rattachementServi,
  zSujetResponseDto as sujetServi,
} from '../contrat/zod.gen';
import type { SujetDuFil } from '../src/app/core/adapters/formations-fil';
import type { RapportSeance } from '../src/app/core/ports/formations.port';
import { TYPES_QUESTION } from '../src/cours/content/types';
import type { EtatParticipant, ResumeBareme } from '../src/cours/content/types';
import { zEtatDeSeanceResponseDto as etatServi } from '../contrat/zod.gen';
import type { EtatSession } from '../src/cours/runtime/core/sync';
import { buildAuthSession, buildAuthUser } from '../src/testing/factories/auth.factory';
import {
  buildRapportSeance,
  buildRattachement,
  buildRegleNotation,
  buildResultatsSeance,
  buildResumeBareme,
  buildStatistiquesSeance,
} from '../src/testing/factories/rapport-seance.factory';
import { etatParticipantVierge } from '../src/testing/fixtures/etat-participant';

export const API_BASE = 'http://localhost:3000/api/v1/portfolio25';

const MOCK_USER = buildAuthUser({
  id: '1',
  email: 'test@test.com',
  firstName: 'Test',
  lastName: 'User',
  roles: [],
});

export const MOCK_SESSION = buildAuthSession({
  accessToken: 'fake-jwt-token-for-e2e-tests',
  user: MOCK_USER,
});

export const SESSION_FORMATEUR = buildAuthSession({
  ...MOCK_SESSION,
  user: { ...MOCK_USER, roles: ['teacher'] },
});

export const B2_SLUG = 'b2-01-traitement-information-chiffree';

interface EcranCatalogue {
  readonly id: string;
  readonly type: 'fp-story';
  readonly titre: null;
  readonly duree: number;
  readonly interactif: boolean;
  readonly donnees: {
    readonly recit: {
      readonly id: string;
      readonly presentation: {
        readonly version: 2;
        readonly screenId: string;
        readonly renderer: string;
        readonly props: Readonly<Record<string, unknown>>;
      };
      readonly metadonnees: typeof METADONNEES_D_UN_RECIT;
    };
  };
}

const METADONNEES_D_UN_RECIT = {
  concepts: [],
  misconceptionsCiblees: [],
  dureeMinutes: 3,
  modalite: 'solo',
  regime: 'ouvert',
} as const;

function identifiantB2(rang: number): string {
  return `B2-01-S${String(rang).padStart(2, '0')}`;
}

function ecranB2(
  rang: number,
  renderer: string,
  props: Readonly<Record<string, unknown>>,
): EcranCatalogue {
  const id = identifiantB2(rang);
  return {
    id,
    type: 'fp-story',
    titre: null,
    duree: 3,
    interactif: renderer === 'quiz',
    donnees: {
      recit: {
        id,
        presentation: { version: 2, screenId: id, renderer, props },
        metadonnees: METADONNEES_D_UN_RECIT,
      },
    },
  };
}

export function ecranB2Graphique(
  rang: number,
  props: Readonly<Record<string, unknown>>,
): EcranCatalogue {
  return ecranB2(rang, 'chart', props);
}

const SEANCE_B2 = {
  sessionId: '33333333-3333-4333-8333-333333333333',
  participantId: '44444444-4444-4444-8444-444444444444',
  jeton: 'participant-b2',
  code: '4822',
} as const;

const SECRET_DE_REPRISE = 'secret-de-reprise-e2e';

const EN_TETES_CORS = {
  'access-control-allow-origin': 'http://localhost:4200',
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'content-type, accept, x-participant-token, authorization',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

export async function servirJson<T>(
  route: Route,
  schema: z.ZodType<T>,
  corps: NoInfer<T>,
  statut = 200,
): Promise<void> {
  schema.parse(corps);
  await route.fulfill({
    status: statut,
    headers: { ...EN_TETES_CORS, 'content-type': 'application/json' },
    body: JSON.stringify(corps),
  });
}

export async function servirRefus(
  route: Route,
  statut: number,
  probleme: Readonly<Record<string, unknown>>,
): Promise<void> {
  if (statut < 400) {
    throw new Error(`Une réponse ${statut} se sert par servirJson et le schéma qui la lit.`);
  }
  await route.fulfill({
    status: statut,
    headers: { ...EN_TETES_CORS, 'content-type': 'application/json' },
    body: JSON.stringify(probleme),
  });
}

export async function servirSansContenu(route: Route): Promise<void> {
  await route.fulfill({ status: 204, headers: EN_TETES_CORS });
}

export async function servirFlux(route: Route, ...etats: readonly EtatSession[]): Promise<void> {
  etats.forEach((etat) => etatServi.parse(etat));
  await route.fulfill({
    status: 200,
    headers: { ...EN_TETES_CORS, 'content-type': 'text/event-stream' },
    body: etats.map((etat) => `event: etat\ndata: ${JSON.stringify(etat)}\n\n`).join(''),
  });
}

export const ETAT_EN_COURS: EtatSession = {
  etat: 'en_cours',
  modeRythme: 'pilote',
  ecranCourant: 0,
  intervalleLibre: null,
  revision: 0,
  pilotage: {},
  majLe: '2026-09-20T08:00:00.000Z',
};

const SANS_QUESTION_NOTEE = Object.fromEntries(
  TYPES_QUESTION.map((type) => [type, { notees: 0, nonNotees: 0 }]),
) as ResumeBareme['parType'];

export function rapportDeSeance(surcharges: Partial<RapportSeance>): RapportSeance {
  return buildRapportSeance({
    courseSlug: B2_SLUG,
    ouverteLe: '2026-09-20T08:00:00.000Z',
    fermeeLe: '2026-09-20T10:00:00.000Z',
    conceptsFragiles: [],
    resultats: buildResultatsSeance({ participants: 0, questions: [] }),
    statistiques: buildStatistiquesSeance({ tauxParticipation: 0, tauxReussite: 0 }),
    notation: buildRegleNotation({ seuilQuestionProbleme: 0.5 }),
    bareme: buildResumeBareme({ questionsNotees: 0, parType: SANS_QUESTION_NOTEE }),
    ...surcharges,
  });
}

export async function intercepterApi(
  page: Page,
  traiter: (route: Route, chemin: string, methode: string) => Promise<void>,
): Promise<void> {
  await page.route(`${API_BASE}/**`, async (route) => {
    const requete = route.request();
    if (requete.method() === 'OPTIONS') {
      await servirSansContenu(route);
      return;
    }
    await traiter(route, new URL(requete.url()).pathname, requete.method());
  });
}

export interface IdentiteEtudiante {
  readonly prenom: string;
  readonly nom: string;
  readonly email: string;
}

const LEA: IdentiteEtudiante = {
  prenom: 'Lea',
  nom: 'Dubois',
  email: 'lea.dubois@example.com',
};

export async function remplirLaJonction(
  page: Page,
  code: string,
  identite: IdentiteEtudiante = LEA,
): Promise<void> {
  await page.getByLabel('Code de la séance').fill(code);
  await page.getByLabel('Prénom').fill(identite.prenom);
  await page.getByLabel('Nom', { exact: true }).fill(identite.nom);
  await page.getByLabel('Adresse e-mail').fill(identite.email);
  await page.getByRole('button', { name: 'Entrer dans la séance' }).click();
}

export interface Jonction {
  readonly participantId: string;
  readonly sessionId: string;
  readonly ecranCourant: number;
  readonly jeton: string;
}

export async function servirLaJonction(route: Route, jonction: Jonction): Promise<void> {
  await servirJson(
    route,
    rattachementServi,
    buildRattachement({ ...jonction, secretDeReprise: SECRET_DE_REPRISE }),
    201,
  );
}

export const RAPPEL_DE_SORTIE: DonneesFpRecall['question'] = {
  id: 'R-SORTIE-09',
  enonce: 'Le taux équivalent mensuel d’un taux annuel de 12 % vaut :',
  options: [
    { id: 'a', libelle: 'Un peu moins de 1 %' },
    { id: 'b', libelle: 'Exactement 1 %' },
  ],
  metadonnees: {
    concepts: ['taux-equivalent'],
    misconceptionsCiblees: [],
    dureeMinutes: 5,
    modalite: 'solo',
    regime: 'ouvert',
  },
};

const SUJET_DE_SORTIE: SujetDuFil = {
  id: B2_SLUG,
  titre: 'Décider avec des taux fiables',
  niveau: 'B2',
  duree: 195,
  concepts: ['taux'],
  ecrans: [
    {
      id: 'ecran-sortie',
      type: 'fp-recall',
      titre: 'Rappel de sortie',
      duree: 5,
      interactif: true,
      donnees: { question: RAPPEL_DE_SORTIE, delaiMs: 1000 },
    },
  ],
};

export interface SeanceDeSortie {
  readonly id: string;
  readonly code: string;
}

export function etatDuParticipant(
  seance: SeanceDeSortie,
  participantId: string,
  revision: number,
  reponses: EtatParticipant['reponses'] = [],
): EtatParticipant {
  return {
    ...etatParticipantVierge({ sessionId: seance.id, participantId, revision }),
    reponses,
  };
}

interface MontageDeSortie {
  readonly seance: SeanceDeSortie;
  readonly participantId: string;
  readonly jeton: string;
  readonly etat: () => EtatParticipant;
  readonly flux: readonly EtatSession[];
  readonly ecritures: Readonly<Record<string, (route: Route) => Promise<void>>>;
}

export async function installerLaSeanceDeSortie(
  page: Page,
  montage: MontageDeSortie,
): Promise<void> {
  const { seance, participantId, jeton } = montage;
  const racine = `/sessions/${seance.id}/`;
  await intercepterApi(page, async (route, chemin) => {
    const ecriture = Object.entries(montage.ecritures).find(([suffixe]) =>
      chemin.endsWith(`${racine}${suffixe}`),
    );
    if (chemin.endsWith(`/sessions/${seance.code}/join`)) {
      await servirLaJonction(route, {
        participantId,
        sessionId: seance.id,
        ecranCourant: 0,
        jeton,
      });
    } else if (chemin.endsWith(`${racine}sujet`)) {
      await servirJson(route, sujetServi, SUJET_DE_SORTIE);
    } else if (chemin.endsWith(`${racine}moi`)) {
      await servirJson(route, etatParticipantServi, montage.etat());
    } else if (ecriture !== undefined) {
      await ecriture[1](route);
    } else if (chemin.endsWith(`${racine}stream`)) {
      await servirFlux(route, ...montage.flux);
    } else {
      await servirSansContenu(route);
    }
  });
}

export async function ouvrirEcranEtudiantB2(
  page: Page,
  ecrans: readonly EcranCatalogue[],
  ecranCourant: number,
): Promise<void> {
  const { sessionId, participantId, jeton, code } = SEANCE_B2;
  await intercepterApi(page, async (route, chemin, methode) => {
    if (methode === 'POST' && chemin.endsWith(`/sessions/${code}/join`)) {
      await servirLaJonction(route, { participantId, sessionId, ecranCourant, jeton });
    } else if (methode === 'GET' && chemin.endsWith(`/sessions/${sessionId}/sujet`)) {
      await servirJson(
        route,
        sujetServi,
        sujetServi.parse({
          id: B2_SLUG,
          titre: 'Lire et contrôler l’information chiffrée',
          niveau: 'B2',
          duree: 210,
          concepts: ['proportions', 'taux', 'evolutions'],
          ecrans,
        }),
      );
    } else if (methode === 'GET' && chemin.endsWith(`/sessions/${sessionId}/stream`)) {
      await servirFlux(route, { ...ETAT_EN_COURS, ecranCourant });
    } else {
      await route.continue();
    }
  });
  await page.goto('/cours/rejoindre');
  await remplirLaJonction(page, code);
}
