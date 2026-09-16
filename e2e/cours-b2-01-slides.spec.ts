import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';
import type { DerouleCours, EcranContent } from '../src/cours/content/types';
import sujetB201 from '../src/testing/fixtures/cours/b2-01-traitement-information-chiffree.sujet.json';

const API = 'http://localhost:3000/api/v1/portfolio25';
const SESSION = '11111111-1111-4111-8111-111111111111';
const PARTICIPANT = '22222222-2222-4222-8222-222222222222';
const CODE = '4821';
const JETON = 'participant-token';

const CORS_HEADERS = {
  'access-control-allow-origin': 'http://localhost:4200',
  'access-control-allow-headers': 'content-type, accept, x-participant-token, authorization',
  'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
};

const BONNES_REPONSES_B201 = new Map<string, string>([
  ['B2-01-RAPPEL-PART-TOTAL', 'o2'],
  ['B2-01-CHOIX-REFERENCE', 'o1'],
  ['B2-01-MONTANT-POURCENTAGE', '750'],
  ['B2-01-FORMULE-TABLEUR', 'o2'],
  ['B2-01-TAUX-EVOLUTION', '30'],
  ['B2-01-TOTAL-DEPUIS-PART', '3800'],
  ['B2-01-CONTROLE-COHERENCE', 'o3'],
  ['B2-01-TRANSFERT-METHODE', 'o1'],
  ['B2-01-SORTIE-METHODE', 'o3'],
]);

function sse(etat: Record<string, unknown>): string {
  return `event: etat\ndata: ${JSON.stringify(etat)}\n\n`;
}

async function repondre(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function identifiantsDesQuestions(ecran: EcranContent): readonly string[] {
  const donnees = ecran.donnees;
  let montages: readonly unknown[];
  if (ecran.type === 'questionnaire') {
    montages = Array.isArray(donnees?.['questions']) ? donnees['questions'] : [];
  } else {
    montages = [{ brique: ecran.type, donnees }];
  }

  return montages.flatMap((montage) => {
    if (typeof montage !== 'object' || montage === null || Array.isArray(montage)) {
      return [];
    }
    const donneesDeBrique = (montage as Record<string, unknown>)['donnees'];
    if (
      typeof donneesDeBrique !== 'object' ||
      donneesDeBrique === null ||
      Array.isArray(donneesDeBrique)
    ) {
      return [];
    }
    const porteurRecord = donneesDeBrique as Record<string, unknown>;
    const porteur = porteurRecord['question'] ?? porteurRecord['billet'];
    if (typeof porteur !== 'object' || porteur === null || Array.isArray(porteur)) {
      return [];
    }
    const porteurObjet = porteur as Record<string, unknown>;
    return typeof porteurObjet['id'] === 'string' ? [porteurObjet['id']] : [];
  });
}

const derouleB201: DerouleCours = {
  ...sujetB201,
  ecrans: sujetB201.ecrans.map((ecran, index) => ({
    ...ecran,
    notes: `Étape ${index + 1} : faire verbaliser la décision avant le passage à l’écran suivant.`,
    seuil: ecran.interactif ? 0.7 : null,
    corriges: identifiantsDesQuestions(ecran).map((questionId) => ({
      questionId,
      bonneReponse: BONNES_REPONSES_B201.get(questionId) ?? 'non définie',
      confusions: [],
    })),
  })),
  remediations: {},
};

async function installerApiPresentateur(page: Page): Promise<{ readonly controles: number[] }> {
  const controles: number[] = [];
  await page.route(`${API}/**`, async (route) => {
    const requete = route.request();
    const url = new URL(requete.url());
    if (requete.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    if (url.pathname.endsWith('/auth/me')) {
      await repondre(route, {
        id: 'teacher-1',
        email: 'formateur@example.com',
        firstName: 'Anne',
        lastName: 'Formateur',
        phone: null,
        isActive: true,
        roles: ['teacher'],
      });
      return;
    }
    if (url.pathname.endsWith(`/sessions/${SESSION}/results`)) {
      await repondre(route, {
        courseSlug: derouleB201.id,
        code: CODE,
        ouverteLe: '2026-09-15T08:00:00.000Z',
        fermeeLe: null,
        participants: [],
        conceptsFragiles: [],
        resultats: { participants: 18, questions: [] },
      });
      return;
    }
    if (url.pathname.endsWith(`/sessions/${SESSION}/deroule`)) {
      await repondre(route, derouleB201);
      return;
    }
    if (url.pathname.endsWith(`/sessions/${SESSION}/presenter-stream`)) {
      await route.fulfill({
        status: 200,
        headers: { ...CORS_HEADERS, 'content-type': 'text/event-stream' },
        body: sse({
          etat: 'en_cours',
          modeRythme: 'pilote',
          ecranCourant: 0,
          intervalleLibre: null,
          participants: 18,
        }),
      });
      return;
    }
    if (url.pathname.endsWith(`/sessions/${SESSION}/control`) && requete.method() === 'PATCH') {
      const corps = requete.postDataJSON() as { ecran?: number };
      if (typeof corps.ecran === 'number') {
        controles.push(corps.ecran);
      }
      await repondre(route, {});
      return;
    }
    await route.continue();
  });
  return { controles };
}

async function installerApiEtudiant(page: Page): Promise<void> {
  await page.route(`${API}/**`, async (route) => {
    const requete = route.request();
    const url = new URL(requete.url());
    if (requete.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    if (url.pathname.endsWith(`/sessions/${CODE}/join`) && requete.method() === 'POST') {
      await repondre(
        route,
        {
          participantId: PARTICIPANT,
          sessionId: SESSION,
          ecranCourant: 0,
          modeRythme: 'pilote',
          jeton: JETON,
        },
        201,
      );
      return;
    }
    if (url.pathname.endsWith(`/sessions/${SESSION}/sujet`)) {
      await repondre(route, sujetB201);
      return;
    }
    if (url.pathname.endsWith(`/sessions/${SESSION}/stream`)) {
      await route.fulfill({
        status: 200,
        headers: { ...CORS_HEADERS, 'content-type': 'text/event-stream' },
        body: sse({
          etat: 'en_cours',
          modeRythme: 'pilote',
          ecranCourant: 0,
          intervalleLibre: null,
          participants: 1,
        }),
      });
      return;
    }
    await route.continue();
  });
}

test.describe('B2-01 — parcours visuel complet', () => {
  test('le formateur peut projeter et contrôler chaque écran du cours', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('portfolio_jwt', 'teacher-token');
      localStorage.setItem('portfolio_jwt_expire_le', String(Date.now() + 900_000));
    });
    const api = await installerApiPresentateur(page);

    await page.goto(`/cours/presenter/${derouleB201.id}?seance=${SESSION}`);
    await expect(page.getByTestId('presentateur-titre')).toHaveText(derouleB201.titre);
    await expect(page.getByTestId('presentateur-participants-nombre')).toHaveText('18');

    const curseur = page.getByTestId('presentateur-slider');
    await expect(curseur).toHaveAttribute('max', String(derouleB201.ecrans.length - 1));

    for (const [index, ecran] of derouleB201.ecrans.entries()) {
      await curseur.fill(String(index));
      await expect(curseur).toHaveValue(String(index));
      await expect(page.getByTestId('presentateur-ecran-slider')).toHaveText(
        `${index + 1} / ${derouleB201.ecrans.length}`,
      );
      await expect(page.getByTestId('presentateur-notes')).toBeVisible();
      await expect(page.getByTestId('cours-ecran-echec')).toHaveCount(0);
      await expect(page.getByTestId('cours-ecran-inconnu')).toHaveCount(0);

      const nombreDeBriques =
        ecran.type === 'questionnaire' && Array.isArray(ecran.donnees?.['questions'])
          ? ecran.donnees['questions'].length
          : 1;
      await expect(
        page.locator('app-cours-ecran [data-testid="cours-ecran-hote"] > *'),
      ).toHaveCount(nombreDeBriques);
    }

    await expect.poll(() => api.controles).toEqual(derouleB201.ecrans.map((_, index) => index));
  });

  test('l’étudiant suit le premier écran sans accès au pilotage formateur', async ({ page }) => {
    await installerApiEtudiant(page);
    await page.goto('/cours/rejoindre');
    await page.getByLabel('Code de la séance').fill(CODE);
    await page.getByLabel('Prénom').fill('Léa');
    await page.getByLabel('Nom', { exact: true }).fill('Dubois');
    await page.getByLabel('Adresse e-mail').fill('lea.dubois@example.com');
    await page.getByRole('button', { name: 'Entrer dans la séance' }).click();

    await expect(page.getByTestId('etudiant-seance')).toBeVisible();
    await expect(page.getByTestId('etudiant-progression')).toHaveText('1 / 60');
    await expect(page.locator('app-cours-ecran')).toBeVisible();
    await expect(page.locator('app-cours-ecran fp-recall')).toHaveCount(1);
    await expect(page.getByTestId('presentateur-slider')).toHaveCount(0);
    await expect(page.getByTestId('etudiant-slider')).toHaveCount(0);
  });
});
