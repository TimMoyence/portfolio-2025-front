import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

const API = 'http://localhost:3000/api/v1/portfolio25';
const PARTICIPANT = '22222222-2222-4222-8222-222222222222';
const SEANCE_A = { id: '11111111-1111-4111-8111-111111111111', code: '4821' };
const SEANCE_B = { id: '44444444-4444-4444-8444-444444444444', code: '5932' };
const TEXTE = 'Le passage du taux annuel au taux mensuel reste flou';
const CONFUSION = 'Taux annuel divisé par 12';

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
      duree: 5,
      interactif: true,
      donnees: { billet: BILLET },
    },
  ],
};

const CORS = {
  'access-control-allow-origin': 'http://localhost:4200',
  'access-control-allow-headers': 'content-type, accept, x-participant-token, authorization',
  'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
};

interface Seance {
  readonly id: string;
  readonly code: string;
}

function etatDuParticipant(seance: Seance, repondu: boolean): Record<string, unknown> {
  return {
    sessionId: seance.id,
    participantId: PARTICIPANT,
    revision: repondu ? 1 : 0,
    reponses: repondu
      ? [
          {
            questionId: BILLET.id,
            valeur: 'b',
            correcte: false,
            score: null,
            details: null,
            libelleConfusion: CONFUSION,
          },
        ]
      : [],
    reponsesLibres: [],
    jalons: [],
    enigmes: [],
    defis: [],
    rappels: { questionIds: [] },
  };
}

async function servir(route: Route, corps: unknown, statut = 200): Promise<void> {
  await route.fulfill({
    status: statut,
    headers: { ...CORS, 'content-type': 'application/json' },
    body: JSON.stringify(corps),
  });
}

async function installerLaSeance(page: Page, seance: Seance): Promise<void> {
  let repondu = false;
  await page.route(`${API}/**`, async (route) => {
    const requete = route.request();
    const chemin = new URL(requete.url()).pathname;
    if (requete.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
    } else if (chemin.endsWith(`/sessions/${seance.code}/join`)) {
      await servir(
        route,
        {
          participantId: PARTICIPANT,
          sessionId: seance.id,
          ecranCourant: 0,
          modeRythme: 'pilote',
          jeton: 'jeton',
        },
        201,
      );
    } else if (chemin.endsWith(`/sessions/${seance.id}/sujet`)) {
      await servir(route, SUJET);
    } else if (chemin.endsWith(`/sessions/${seance.id}/moi`)) {
      await servir(route, etatDuParticipant(seance, repondu));
    } else if (chemin.endsWith(`/sessions/${seance.id}/answers`)) {
      repondu = true;
      await servir(
        route,
        { correcte: false, misconception: null, libelleConfusion: CONFUSION },
        201,
      );
    } else if (chemin.endsWith(`/sessions/${seance.id}/free-responses`)) {
      await servir(route, { status: 'enregistre' }, 201);
    } else if (chemin.endsWith(`/sessions/${seance.id}/stream`)) {
      await route.fulfill({
        status: 200,
        headers: { ...CORS, 'content-type': 'text/event-stream' },
        body: `event: etat\ndata: ${JSON.stringify({ etat: 'en_cours', modeRythme: 'pilote', ecranCourant: 0, intervalleLibre: null, participants: 1 })}\n\n`,
      });
    } else {
      await route.fulfill({ status: 204, headers: CORS });
    }
  });
}

async function rejoindre(page: Page, seance: Seance): Promise<void> {
  await page.goto('/cours/rejoindre');
  await page.getByLabel('Code de la séance').fill(seance.code);
  await page.getByLabel('Prénom').fill('Lea');
  await page.getByLabel('Nom', { exact: true }).fill('Dubois');
  await page.getByLabel('Adresse e-mail').fill('lea.dubois@example.com');
  await page.getByRole('button', { name: 'Entrer dans la séance' }).click();
  await expect(page.locator('fp-exit [data-testid="texte-libre"]')).toBeVisible();
}

function cleDuBrouillon(seance: Seance): string {
  return `fp.${seance.id}.${PARTICIPANT}.fp-exit.${BILLET.id}`;
}

async function brouillonEcrit(page: Page, seance: Seance): Promise<void> {
  await expect
    .poll(() => page.evaluate((cle) => localStorage.getItem(cle), cleDuBrouillon(seance)))
    .not.toBeNull();
}

test.describe('AC-33 : reprise d’un poste étudiant rechargé', () => {
  test('restaure le brouillon, puis après envoi le verdict et le déjà répondu', async ({
    page,
  }) => {
    await installerLaSeance(page, SEANCE_A);
    await rejoindre(page, SEANCE_A);
    await page.locator('fp-exit [data-testid="texte-libre"]').fill(TEXTE);
    await brouillonEcrit(page, SEANCE_A);

    await page.reload();
    await rejoindre(page, SEANCE_A);

    await expect(page.locator('fp-exit [data-testid="texte-libre"]')).toHaveValue(TEXTE);
    await expect(page.locator('fp-exit [data-testid="brouillon-restaure"]')).toHaveText(
      'Brouillon restauré',
    );

    await page.locator('fp-exit [data-option="b"]').click();
    await page.locator('fp-exit [data-testid="envoyer"]').click();
    await expect(page.locator('fp-exit [data-testid="verdict"]')).toContainText(CONFUSION);

    await page.reload();
    await rejoindre(page, SEANCE_A);

    await expect(page.locator('fp-exit [data-testid="verdict"]')).toContainText(CONFUSION);
    await expect(page.locator('fp-exit [data-testid="deja-repondu"]')).toHaveText(
      'Réponse déjà enregistrée : voici votre verdict',
    );
    await expect(page.locator('fp-exit [data-testid="texte-libre"]')).toBeDisabled();
  });

  test('ne reprend pas dans une seconde séance le brouillon de la première', async ({ page }) => {
    await installerLaSeance(page, SEANCE_A);
    await rejoindre(page, SEANCE_A);
    await page.locator('fp-exit [data-testid="texte-libre"]').fill(TEXTE);
    await brouillonEcrit(page, SEANCE_A);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await installerLaSeance(page, SEANCE_B);
    await rejoindre(page, SEANCE_B);

    await expect(page.locator('fp-exit [data-testid="texte-libre"]')).toHaveValue('');
    await expect(page.locator('fp-exit [data-testid="brouillon-restaure"]')).toHaveCount(0);
    expect(
      await page.evaluate((cle) => localStorage.getItem(cle), cleDuBrouillon(SEANCE_A)),
    ).toBeNull();
  });
});
