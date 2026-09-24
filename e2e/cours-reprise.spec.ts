import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  BILLET_DE_SORTIE,
  EN_TETES_CORS,
  ETAT_EN_COURS,
  SUJET_DE_SORTIE,
  intercepterApi,
  remplirLaJonction,
  servirFlux,
  servirJson,
} from './fixtures';

const PARTICIPANT = '22222222-2222-4222-8222-222222222222';
const SEANCE_A = { id: '11111111-1111-4111-8111-111111111111', code: '4821' };
const SEANCE_B = { id: '44444444-4444-4444-8444-444444444444', code: '5932' };
const TEXTE = 'Le passage du taux annuel au taux mensuel reste flou';
const CONFUSION = 'Taux annuel divisé par 12';
const DELAI_ENTREE_MS = 20_000;

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
            questionId: BILLET_DE_SORTIE.id,
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

async function installerLaSeance(page: Page, seance: Seance): Promise<void> {
  let repondu = false;
  await intercepterApi(page, async (route, chemin) => {
    if (chemin.endsWith(`/sessions/${seance.code}/join`)) {
      await servirJson(
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
      await servirJson(route, SUJET_DE_SORTIE);
    } else if (chemin.endsWith(`/sessions/${seance.id}/moi`)) {
      await servirJson(route, etatDuParticipant(seance, repondu));
    } else if (chemin.endsWith(`/sessions/${seance.id}/answers`)) {
      repondu = true;
      await servirJson(
        route,
        { correcte: false, misconception: null, libelleConfusion: CONFUSION },
        201,
      );
    } else if (chemin.endsWith(`/sessions/${seance.id}/free-responses`)) {
      await servirJson(route, { status: 'enregistre' }, 201);
    } else if (chemin.endsWith(`/sessions/${seance.id}/stream`)) {
      await servirFlux(route, ETAT_EN_COURS);
    } else {
      await route.fulfill({ status: 204, headers: EN_TETES_CORS });
    }
  });
}

async function rejoindre(page: Page, seance: Seance): Promise<void> {
  await page.goto('/cours/rejoindre');
  const bannièreCookies = page.locator('app-cookie-banner');
  if (await bannièreCookies.isVisible().catch(() => false)) {
    await bannièreCookies.getByRole('button').last().click();
  }
  await remplirLaJonction(page, seance.code);
  await expect(page.locator('fp-exit [data-testid="texte-libre"]')).toBeVisible({
    timeout: DELAI_ENTREE_MS,
  });
}

function cleDuBrouillon(seance: Seance): string {
  return `fp.${seance.id}.${PARTICIPANT}.fp-exit.${BILLET_DE_SORTIE.id}`;
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
