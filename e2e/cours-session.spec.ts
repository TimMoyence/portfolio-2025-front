import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

const API = 'http://localhost:3000/api/v1/portfolio25';
const SESSION = '11111111-1111-4111-8111-111111111111';
const PARTICIPANT = '22222222-2222-4222-8222-222222222222';
const JETON = 'participant-token';
const CODE = '4821';
const REPONSE_LENTE_MS = 4000;
const IDENTITE = {
  prenom: 'Lea',
  nom: 'Dubois',
  email: 'lea.dubois@example.com',
};

const QUESTION = {
  id: 'Q-CAP-03',
  enonce: 'Un capital de 1 000 € placé à 4 % pendant 10 ans vaut environ :',
  options: [
    { id: 'a', libelle: '1 400 €' },
    { id: 'b', libelle: '1 480,24 €' },
    { id: 'c', libelle: '10 400 €' },
  ],
};

const SUJET = {
  id: 'b2-01-traitement-information-chiffree',
  titre: 'Décider avec des taux fiables',
  niveau: 'B2',
  duree: 195,
  concepts: ['proportions', 'taux', 'evolutions'],
  ecrans: [
    {
      id: 'ecran-1',
      type: 'fp-vote',
      duree: 180,
      interactif: true,
      donnees: { question: QUESTION },
    },
    {
      id: 'ecran-2',
      type: 'ecran-verrouille',
      duree: 180,
      interactif: false,
      donnees: {},
    },
  ],
};

const DEROULE = {
  ...SUJET,
  ecrans: [
    {
      ...SUJET.ecrans[0],
      notes: 'Faire verbaliser la différence entre taux simple et composé.',
      seuil: 0.7,
      corriges: [
        {
          questionId: QUESTION.id,
          bonneReponse: 'b',
          confusions: [{ id: 'interet-simple', libelle: 'Intérêt simple' }],
        },
      ],
    },
  ],
  remediations: {},
};

const CORS_HEADERS = {
  'access-control-allow-origin': 'http://localhost:4200',
  'access-control-allow-headers': 'content-type, accept, x-participant-token, authorization',
  'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
};

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

async function installerApiEtudiant(
  page: Page,
  options: { readonly sujetLent?: boolean; readonly fluxRefuse?: boolean } = {},
): Promise<{ readonly flux: () => number; readonly reponses: () => number }> {
  let fluxOuverts = 0;
  let reponses = 0;

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
    if (url.pathname.endsWith(`/sessions/${SESSION}/sujet`) && requete.method() === 'GET') {
      if (options.sujetLent) {
        await new Promise((resolve) => setTimeout(resolve, REPONSE_LENTE_MS));
      }
      await repondre(route, SUJET);
      return;
    }
    if (url.pathname.endsWith(`/sessions/${SESSION}/stream`) && requete.method() === 'GET') {
      fluxOuverts += 1;
      if (options.fluxRefuse) {
        await repondre(route, { title: 'Flux refusé' }, 429);
      } else {
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
      }
      return;
    }
    if (url.pathname.endsWith(`/sessions/${SESSION}/answers`) && requete.method() === 'POST') {
      reponses += 1;
      await repondre(route, { correcte: true, misconception: null, libelleConfusion: null }, 201);
      return;
    }
    await route.continue();
  });

  return { flux: () => fluxOuverts, reponses: () => reponses };
}

async function rejoindre(page: Page): Promise<void> {
  await page.goto('/cours/rejoindre');
  await page.getByLabel('Code de la séance').fill(CODE);
  await page.getByLabel('Prénom').fill(IDENTITE.prenom);
  await page.getByLabel('Nom', { exact: true }).fill(IDENTITE.nom);
  await page.getByLabel('Adresse e-mail').fill(IDENTITE.email);
  await page.getByRole('button', { name: 'Entrer dans la séance' }).click();
}

test.describe('Séance de cours dans un navigateur réel', () => {
  test('le poste attend avant le démarrage puis retrouve ses activités après coupure réseau', async ({
    page,
  }) => {
    const api = await installerApiEtudiant(page);
    await rejoindre(page);

    await expect(page.getByTestId('etudiant-seance')).toBeVisible();
    await expect(page.locator('app-slide-activity')).toBeVisible();

    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await page.locator('fp-vote [data-testid="option"]').first().click();
    await expect(page.getByTestId('etudiant-hors-ligne')).toBeVisible();
    expect(api.reponses()).toBe(0);

    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect(page.getByTestId('etudiant-hors-ligne')).toBeHidden();
    await expect(page.locator('fp-vote [data-testid="verdict"]')).toBeVisible();
    await expect(page.locator('fp-vote [data-testid="option"]').first()).toBeDisabled();
    expect(api.reponses()).toBe(1);
  });

  test('signale un flux refusé au lieu de laisser croire que la séance attend le formateur', async ({
    page,
  }) => {
    await installerApiEtudiant(page, { fluxRefuse: true });
    await rejoindre(page);

    await expect(page.getByTestId('etudiant-flux-refuse')).toHaveAttribute('data-statut', '429');
    await expect(page.getByTestId('etudiant-attente')).toBeHidden();
  });

  test('affiche le chargement pendant une réponse serveur lente sur un écran étroit', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installerApiEtudiant(page, { sujetLent: true });
    await page.goto('/cours/rejoindre');
    await page.getByLabel('Code de la séance').fill(CODE);
    await page.getByLabel('Prénom').fill(IDENTITE.prenom);
    await page.getByLabel('Nom', { exact: true }).fill(IDENTITE.nom);
    await page.getByLabel('Adresse e-mail').fill(IDENTITE.email);
    await page.getByRole('button', { name: 'Entrer dans la séance' }).click();

    await expect(page.getByTestId('etudiant-chargement')).toBeVisible();
    await expect(page.getByTestId('etudiant-seance')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  });

  test('reprend un pupitre rechargé avec son déroulé et son flux', async ({ page }) => {
    await page.addInitScript(
      ({ token }) => {
        localStorage.setItem('portfolio_jwt', token);
        localStorage.setItem('portfolio_jwt_expire_le', String(Date.now() + 900_000));
      },
      { token: 'teacher-token' },
    );

    await page.route(`${API}/**`, async (route) => {
      const requete = route.request();
      const url = new URL(requete.url());
      if (requete.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS_HEADERS });
      } else if (url.pathname.endsWith('/auth/me')) {
        await repondre(route, {
          id: 'teacher-1',
          email: 'formateur@example.com',
          firstName: 'Anne',
          lastName: 'Formateur',
          phone: null,
          isActive: true,
          roles: ['teacher'],
        });
      } else if (url.pathname.endsWith(`/sessions/${SESSION}/results`)) {
        await repondre(route, {
          courseSlug: 'b2-01-traitement-information-chiffree',
          code: CODE,
          ouverteLe: '2026-09-15T08:00:00.000Z',
          fermeeLe: '2026-09-15T10:00:00.000Z',
          participants: [],
          conceptsFragiles: [],
          resultats: { participants: 1, questions: [] },
        });
      } else if (url.pathname.endsWith(`/sessions/${SESSION}/deroule`)) {
        await repondre(route, DEROULE);
      } else if (url.pathname.endsWith(`/sessions/${SESSION}/presenter-stream`)) {
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
      } else {
        await route.continue();
      }
    });

    const url = `/cours/presenter/b2-01-traitement-information-chiffree?seance=${SESSION}`;
    await page.goto(url);
    await expect(page.getByTestId('presentateur-code')).toHaveText(CODE);
    await expect(page.getByTestId('presentateur-titre')).toHaveText(DEROULE.titre);

    await page.reload();
    await expect(page.getByTestId('presentateur-code')).toHaveText(CODE);
    await expect(page.getByTestId('presentateur-flux')).toHaveAttribute(
      'data-etat',
      /connecte|reconnexion/,
    );
  });

  test('renouvelle un accès après plus de quinze minutes dans le navigateur', async ({ page }) => {
    let renouvellements = 0;
    await page.clock.install();
    await page.route(`${API}/**`, async (route) => {
      const requete = route.request();
      const url = new URL(requete.url());
      if (requete.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS_HEADERS });
      } else if (url.pathname.endsWith('/auth/me')) {
        await repondre(route, {
          id: 'teacher-1',
          email: 'formateur@example.com',
          firstName: 'Anne',
          lastName: 'Formateur',
          phone: null,
          isActive: true,
          roles: ['teacher'],
        });
      } else if (url.pathname.endsWith('/auth/refresh')) {
        renouvellements += 1;
        await repondre(route, {
          accessToken: `renewed-${renouvellements}`,
          expiresIn: 900,
          user: {
            id: 'teacher-1',
            email: 'formateur@example.com',
            firstName: 'Anne',
            lastName: 'Formateur',
            phone: null,
            isActive: true,
            roles: ['teacher'],
          },
        });
      } else {
        await route.continue();
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('portfolio_jwt', 'initial');
      localStorage.setItem('portfolio_jwt_expire_le', String(Date.now() + 900_000));
      localStorage.setItem(
        'fp.identite',
        JSON.stringify({
          studentKey: '33333333-3333-4333-8333-333333333333',
          prenom: 'Lea',
          nom: 'Dubois',
          email: 'lea.dubois@example.com',
        }),
      );
    });

    await page.goto('/formations');
    await page.clock.fastForward(930_000);
    await expect.poll(() => renouvellements).toBe(1);
    await expect(page.locator('body')).toContainText('Du concret');
  });
});

test('le parcours de rattachement reste utilisable sur un profil téléphone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installerApiEtudiant(page);
  await rejoindre(page);
  await expect(page.getByTestId('etudiant-seance')).toBeVisible();
  await expect(page.getByTestId('etudiant-titre')).toHaveText(SUJET.titre);
});
