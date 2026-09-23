import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';
import { API_BASE } from './fixtures';

const SEANCE = { id: '77777777-7777-4777-8777-777777777777', code: '7412' };
const PARTICIPANT = '88888888-8888-4888-8888-888888888888';

const BILLET = {
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

const SUJET = {
  id: 'b2-01-traitement-information-chiffree',
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
      donnees: { billet: BILLET },
    },
  ],
};

const ETAT_PARTICIPANT = {
  sessionId: SEANCE.id,
  participantId: PARTICIPANT,
  revision: 3,
  reponses: [],
  reponsesLibres: [],
  jalons: [],
  enigmes: [],
  defis: [],
  rappels: { questionIds: [] },
};

const CORS = {
  'access-control-allow-origin': 'http://localhost:4200',
  'access-control-allow-headers': 'content-type, accept, x-participant-token, authorization',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

function problemeDuBack(statut: number, code: string, detail: string): Record<string, unknown> {
  return {
    type: `https://httpstatuses.com/${statut}`,
    title: statut === 409 ? 'CONFLICT' : 'BAD_REQUEST',
    status: statut,
    detail,
    instance: `POST /api/v1/portfolio25/formations/sessions/${SEANCE.id}/answers`,
    code,
  };
}

function fluxDeLaSeance(revision: number, pilotage: Record<string, unknown>): string {
  return `event: etat\ndata: ${JSON.stringify({
    etat: 'en_cours',
    modeRythme: 'pilote',
    ecranCourant: 0,
    intervalleLibre: null,
    participants: 1,
    revision,
    pilotage,
    majLe: '2026-09-20T08:00:00.000Z',
  })}\n\n`;
}

async function servir(route: Route, corps: unknown, statut = 200): Promise<void> {
  await route.fulfill({
    status: statut,
    headers: { ...CORS, 'content-type': 'application/json' },
    body: JSON.stringify(corps),
  });
}

async function installerLaSeance(page: Page, refus: Record<string, unknown>): Promise<void> {
  await page.route(`${API_BASE}/**`, async (route) => {
    const requete = route.request();
    const chemin = new URL(requete.url()).pathname;
    if (requete.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
    } else if (chemin.endsWith(`/sessions/${SEANCE.code}/join`)) {
      await servir(
        route,
        {
          participantId: PARTICIPANT,
          sessionId: SEANCE.id,
          ecranCourant: 0,
          modeRythme: 'pilote',
          jeton: `${PARTICIPANT}.empreinte`,
        },
        201,
      );
    } else if (chemin.endsWith(`/sessions/${SEANCE.id}/sujet`)) {
      await servir(route, SUJET);
    } else if (chemin.endsWith(`/sessions/${SEANCE.id}/moi`)) {
      await servir(route, ETAT_PARTICIPANT);
    } else if (chemin.endsWith(`/sessions/${SEANCE.id}/answers`)) {
      await servir(route, refus, Number(refus['status']));
    } else if (chemin.endsWith(`/sessions/${SEANCE.id}/stream`)) {
      await route.fulfill({
        status: 200,
        headers: { ...CORS, 'content-type': 'text/event-stream' },
        body:
          fluxDeLaSeance(3, {}) +
          fluxDeLaSeance(4, { 'ecran-sortie': { phase: 'revote', revele: false } }),
      });
    } else {
      await route.fulfill({ status: 204, headers: CORS });
    }
  });
}

async function rejoindre(page: Page): Promise<void> {
  await page.goto('/cours/rejoindre');
  await page.getByLabel('Code de la séance').fill(SEANCE.code);
  await page.getByLabel('Prénom').fill('Lea');
  await page.getByLabel('Nom', { exact: true }).fill('Dubois');
  await page.getByLabel('Adresse e-mail').fill('lea.dubois@example.com');
  await page.getByRole('button', { name: 'Entrer dans la séance' }).click();
  await expect(page.locator('fp-exit [data-testid="envoyer"]')).toBeVisible();
}

async function repondre(page: Page): Promise<void> {
  await page.locator('fp-exit [data-option="b"]').click();
  await page.locator('fp-exit [data-testid="envoyer"]').click();
}

test.describe('refus servis par le back sur une écriture étudiante', () => {
  test('dit que l’écran n’est pas encore ouvert quand le back sert un 404 ECRAN_NON_SERVI', async ({
    page,
  }) => {
    await installerLaSeance(
      page,
      problemeDuBack(
        404,
        'ECRAN_NON_SERVI',
        'L’écran ecran-sortie n’a pas encore été projeté : attendez que le formateur y arrive.',
      ),
    );
    await rejoindre(page);
    await repondre(page);

    await expect(page.locator('fp-exit [data-testid="erreur"]')).toContainText('pas encore ouvert');
  });

  test('dit que la séance est terminée quand le back sert un 409 SEANCE_TERMINEE', async ({
    page,
  }) => {
    await installerLaSeance(
      page,
      problemeDuBack(
        409,
        'SEANCE_TERMINEE',
        'La séance est terminée : les réponses ne sont plus acceptées, les résultats restent consultables.',
      ),
    );
    await rejoindre(page);
    await repondre(page);

    await expect(page.locator('fp-exit [data-testid="erreur"]')).toContainText('terminée');
  });
});
