import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  EN_TETES_CORS,
  ETAT_EN_COURS,
  SUJET_DE_SORTIE,
  intercepterApi,
  remplirLaJonction,
  servirFlux,
  servirJson,
} from './fixtures';

const SEANCE = { id: '77777777-7777-4777-8777-777777777777', code: '7412' };
const PARTICIPANT = '88888888-8888-4888-8888-888888888888';

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

function etatDeLaSeance(revision: number, pilotage: Record<string, unknown>): object {
  return { ...ETAT_EN_COURS, revision, pilotage, majLe: '2026-09-20T08:00:00.000Z' };
}

async function installerLaSeance(page: Page, refus: Record<string, unknown>): Promise<void> {
  await intercepterApi(page, async (route, chemin) => {
    if (chemin.endsWith(`/sessions/${SEANCE.code}/join`)) {
      await servirJson(
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
      await servirJson(route, SUJET_DE_SORTIE);
    } else if (chemin.endsWith(`/sessions/${SEANCE.id}/moi`)) {
      await servirJson(route, ETAT_PARTICIPANT);
    } else if (chemin.endsWith(`/sessions/${SEANCE.id}/answers`)) {
      await servirJson(route, refus, Number(refus['status']));
    } else if (chemin.endsWith(`/sessions/${SEANCE.id}/stream`)) {
      await servirFlux(
        route,
        etatDeLaSeance(3, {}),
        etatDeLaSeance(4, { 'ecran-sortie': { phase: 'revote', revele: false } }),
      );
    } else {
      await route.fulfill({ status: 204, headers: EN_TETES_CORS });
    }
  });
}

async function rejoindre(page: Page): Promise<void> {
  await page.goto('/cours/rejoindre');
  await remplirLaJonction(page, SEANCE.code);
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
