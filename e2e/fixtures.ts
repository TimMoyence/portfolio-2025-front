import type { Page } from '@playwright/test';

export const API_BASE = 'http://localhost:3000/api/v1/portfolio25';

const MOCK_USER = {
  id: '1',
  email: 'test@test.com',
  firstName: 'Test',
  lastName: 'User',
  phone: null,
  isActive: true,
  roles: ['weather'],
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

export const MOCK_WEATHER_PREFERENCES = {
  id: 'pref-1',
  userId: '1',
  level: 'discovery' as const,
  favoriteCities: [],
  daysUsed: 5,
  lastUsedAt: '2025-04-01T10:00:00.000Z',
  tooltipsSeen: [],
  units: undefined,
};

export const MOCK_GEOCODING_RESPONSE = {
  results: [
    {
      id: 2988507,
      name: 'Paris',
      latitude: 48.8566,
      longitude: 2.3522,
      country: 'France',
      country_code: 'FR',
      admin1: 'Ile-de-France',
    },
    {
      id: 4717560,
      name: 'Paris',
      latitude: 33.6609,
      longitude: -95.5555,
      country: 'United States',
      country_code: 'US',
      admin1: 'Texas',
    },
  ],
};

export const MOCK_FORECAST = {
  current: {
    time: '2025-04-01T12:00',
    temperature_2m: 18.5,
    weather_code: 1,
    wind_speed_10m: 12.3,
    apparent_temperature: 16.2,
    relative_humidity_2m: 65,
    pressure_msl: 1013,
    uv_index: 4,
    wind_direction_10m: 220,
    wind_gusts_10m: 25,
  },
  hourly: {
    time: Array.from({ length: 24 }, (_, i) => `2025-04-01T${String(i).padStart(2, '0')}:00`),
    temperature_2m: Array.from({ length: 24 }, (_, i) => 14 + Math.sin(i / 4) * 5),
    weather_code: Array(24).fill(1),
    wind_speed_10m: Array(24).fill(12),
    precipitation: Array(24).fill(0),
    relative_humidity_2m: Array(24).fill(65),
  },
  daily: {
    time: ['2025-04-01', '2025-04-02', '2025-04-03'],
    weather_code: [1, 2, 3],
    temperature_2m_max: [20, 22, 19],
    temperature_2m_min: [12, 14, 11],
    sunrise: ['2025-04-01T06:30', '2025-04-02T06:28', '2025-04-03T06:26'],
    sunset: ['2025-04-01T19:45', '2025-04-02T19:47', '2025-04-03T19:49'],
    precipitation_sum: [0, 2.5, 0.3],
  },
};

export async function authenticateUser(page: Page): Promise<void> {
  await page.route(`${API_BASE}/auth/refresh`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SESSION),
    });
  });
  await page.route(`${API_BASE}/auth/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER),
    });
  });

  await page.goto('/');
}

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

export const EN_TETES_CORS = {
  'access-control-allow-origin': 'http://localhost:4200',
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'content-type, accept, x-participant-token, authorization',
  'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
};

function reponseDeLaSeanceB2(
  chemin: string,
  methode: string,
  ecrans: readonly EcranCatalogue[],
  ecranCourant: number,
): { readonly status: number; readonly type: string; readonly corps: string } | null {
  const { sessionId, participantId, jeton, code } = SEANCE_B2;
  if (methode === 'POST' && chemin.endsWith(`/sessions/${code}/join`)) {
    const corps = { participantId, sessionId, ecranCourant, modeRythme: 'pilote', jeton };
    return { status: 201, type: 'application/json', corps: JSON.stringify(corps) };
  }
  if (methode === 'GET' && chemin.endsWith(`/sessions/${sessionId}/sujet`)) {
    const sujet = {
      id: B2_SLUG,
      titre: 'Lire et contrôler l’information chiffrée',
      niveau: 'B2',
      duree: 210,
      concepts: ['proportions', 'taux', 'evolutions'],
      ecrans,
    };
    return { status: 200, type: 'application/json', corps: JSON.stringify(sujet) };
  }
  if (methode === 'GET' && chemin.endsWith(`/sessions/${sessionId}/stream`)) {
    const etat = { etat: 'en_cours', modeRythme: 'pilote', ecranCourant, participants: 1 };
    return {
      status: 200,
      type: 'text/event-stream',
      corps: `event: etat\ndata: ${JSON.stringify({ ...etat, intervalleLibre: null })}\n\n`,
    };
  }
  return null;
}

export async function ouvrirEcranEtudiantB2(
  page: Page,
  ecrans: readonly EcranCatalogue[],
  ecranCourant: number,
): Promise<void> {
  await page.route(`${API_BASE}/**`, async (route) => {
    const requete = route.request();
    if (requete.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: EN_TETES_CORS });
      return;
    }
    const reponse = reponseDeLaSeanceB2(
      new URL(requete.url()).pathname,
      requete.method(),
      ecrans,
      ecranCourant,
    );
    if (reponse === null) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: reponse.status,
      headers: { ...EN_TETES_CORS, 'content-type': reponse.type },
      body: reponse.corps,
    });
  });
  await page.goto('/cours/rejoindre');
  await page.getByLabel('Code de la séance').fill(SEANCE_B2.code);
  await page.getByLabel('Prénom').fill('Lea');
  await page.getByLabel('Nom', { exact: true }).fill('Dubois');
  await page.getByLabel('Adresse e-mail').fill('lea.dubois@example.com');
  await page.getByRole('button', { name: 'Entrer dans la séance' }).click();
}

export async function mockWeatherRecordUsage(page: Page): Promise<void> {
  await page.route(`${API_BASE}/weather/preferences/record-usage`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(undefined),
    });
  });
}
