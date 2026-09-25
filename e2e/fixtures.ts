import type { Page, Route } from '@playwright/test';
import { etatParticipantVierge } from '../src/testing/fixtures/etat-participant';

export const API_BASE = 'http://localhost:3000/api/v1/portfolio25';

const MOCK_USER = {
  id: '1',
  email: 'test@test.com',
  firstName: 'Test',
  lastName: 'User',
  phone: null,
  isActive: true,
  roles: [],
  hasPassword: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  updatedOrCreatedBy: null,
};

export const MOCK_SESSION = {
  accessToken: 'fake-jwt-token-for-e2e-tests',
  expiresIn: 3600,
  user: MOCK_USER,
};

export const B2_SLUG = 'b2-01-traitement-information-chiffree';

interface EcranCatalogue {
  readonly id: string;
  readonly type: 'fp-story';
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
    };
  };
}

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
    duree: 3,
    interactif: renderer === 'quiz',
    donnees: { recit: { id, presentation: { version: 2, screenId: id, renderer, props } } },
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

const EN_TETES_CORS = {
  'access-control-allow-origin': 'http://localhost:4200',
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'content-type, accept, x-participant-token, authorization',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

export async function servirJson(route: Route, corps: unknown, statut = 200): Promise<void> {
  await route.fulfill({
    status: statut,
    headers: { ...EN_TETES_CORS, 'content-type': 'application/json' },
    body: JSON.stringify(corps),
  });
}

export async function servirSansContenu(route: Route): Promise<void> {
  await route.fulfill({ status: 204, headers: EN_TETES_CORS });
}

export async function servirFlux(route: Route, ...etats: readonly unknown[]): Promise<void> {
  await route.fulfill({
    status: 200,
    headers: { ...EN_TETES_CORS, 'content-type': 'text/event-stream' },
    body: etats.map((etat) => `event: etat\ndata: ${JSON.stringify(etat)}\n\n`).join(''),
  });
}

export const ETAT_EN_COURS = {
  etat: 'en_cours',
  modeRythme: 'pilote',
  ecranCourant: 0,
  intervalleLibre: null,
  participants: 1,
} as const;

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

export const BILLET_DE_SORTIE = {
  id: 'B-SORTIE-09',
  question: 'Le taux équivalent mensuel d’un taux annuel de 12 % vaut :',
  invite: 'Qu’est-ce qui reste flou ?',
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

const SUJET_DE_SORTIE = {
  id: B2_SLUG,
  titre: 'Décider avec des taux fiables',
  niveau: 'B2',
  duree: 195,
  concepts: ['taux'],
  ecrans: [
    {
      id: 'ecran-sortie',
      type: 'fp-exit',
      titre: 'Billet de sortie',
      duree: 5,
      interactif: true,
      donnees: { billet: BILLET_DE_SORTIE },
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
  reponses: readonly unknown[] = [],
): Record<string, unknown> {
  return {
    ...etatParticipantVierge({ sessionId: seance.id, participantId, revision }),
    reponses,
  };
}

interface MontageDeSortie {
  readonly seance: SeanceDeSortie;
  readonly participantId: string;
  readonly jeton: string;
  readonly etat: () => unknown;
  readonly flux: readonly unknown[];
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
      const corps = { participantId, sessionId: seance.id, ecranCourant: 0, modeRythme: 'pilote' };
      await servirJson(route, { ...corps, jeton }, 201);
    } else if (chemin.endsWith(`${racine}sujet`)) {
      await servirJson(route, SUJET_DE_SORTIE);
    } else if (chemin.endsWith(`${racine}moi`)) {
      await servirJson(route, montage.etat());
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
      const corps = { participantId, sessionId, ecranCourant, modeRythme: 'pilote', jeton };
      await servirJson(route, corps, 201);
    } else if (methode === 'GET' && chemin.endsWith(`/sessions/${sessionId}/sujet`)) {
      await servirJson(route, {
        id: B2_SLUG,
        titre: 'Lire et contrôler l’information chiffrée',
        niveau: 'B2',
        duree: 210,
        concepts: ['proportions', 'taux', 'evolutions'],
        ecrans,
      });
    } else if (methode === 'GET' && chemin.endsWith(`/sessions/${sessionId}/stream`)) {
      await servirFlux(route, { ...ETAT_EN_COURS, ecranCourant });
    } else {
      await route.continue();
    }
  });
  await page.goto('/cours/rejoindre');
  await remplirLaJonction(page, code);
}
