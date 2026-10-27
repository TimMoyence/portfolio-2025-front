import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { EtatSession } from '../src/cours/runtime/core/sync';
import {
  ETAT_EN_COURS,
  etatDuParticipant,
  installerLaSeanceDeSortie,
  remplirLaJonction,
  servirRefus,
} from './fixtures';

const SEANCE = { id: '77777777-7777-4777-8777-777777777777', code: '7412' };
const PARTICIPANT = '88888888-8888-4888-8888-888888888888';

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

function etatDeLaSeance(revision: number, pilotage: EtatSession['pilotage']): EtatSession {
  return { ...ETAT_EN_COURS, revision, pilotage };
}

async function installerLaSeance(page: Page, refus: Record<string, unknown>): Promise<void> {
  await installerLaSeanceDeSortie(page, {
    seance: SEANCE,
    participantId: PARTICIPANT,
    jeton: `${PARTICIPANT}.empreinte`,
    etat: () => etatDuParticipant(SEANCE, PARTICIPANT, 3),
    flux: [etatDeLaSeance(3, {}), etatDeLaSeance(4, { 'ecran-sortie': { revele: false } })],
    ecritures: { answers: (route) => servirRefus(route, Number(refus['status']), refus) },
  });
}

async function rejoindre(page: Page): Promise<void> {
  await page.goto('/cours/rejoindre');
  await remplirLaJonction(page, SEANCE.code);
  await expect(page.locator('fp-recall [data-option="b"]')).toBeVisible();
}

async function repondre(page: Page): Promise<void> {
  await page.locator('fp-recall [data-option="b"]').click();
}

const REFUS = [
  {
    titre: 'dit que l’écran n’est pas encore ouvert quand le back sert un 404 ECRAN_NON_SERVI',
    statut: 404,
    code: 'ECRAN_NON_SERVI',
    detail: 'L’écran ecran-sortie n’a pas encore été projeté : attendez que le formateur y arrive.',
    message: 'pas encore ouvert',
  },
  {
    titre: 'dit que la séance est terminée quand le back sert un 409 SEANCE_TERMINEE',
    statut: 409,
    code: 'SEANCE_TERMINEE',
    detail:
      'La séance est terminée : les réponses ne sont plus acceptées, les résultats restent consultables.',
    message: 'terminée',
  },
] as const;

test.describe('refus servis par le back sur une écriture étudiante', () => {
  for (const refus of REFUS) {
    test(refus.titre, async ({ page }) => {
      await installerLaSeance(page, problemeDuBack(refus.statut, refus.code, refus.detail));
      await rejoindre(page);
      await repondre(page);

      await expect(page.locator('fp-recall [data-testid="erreur"]')).toContainText(refus.message);
    });
  }
});
