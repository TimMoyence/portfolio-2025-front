import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  BILLET_DE_SORTIE,
  ETAT_EN_COURS,
  etatDuParticipant,
  installerLaSeanceDeSortie,
  remplirLaJonction,
  servirJson,
} from './fixtures';
import type { SeanceDeSortie } from './fixtures';

const PARTICIPANT = '22222222-2222-4222-8222-222222222222';
const SEANCE_A = { id: '11111111-1111-4111-8111-111111111111', code: '4821' };
const SEANCE_B = { id: '44444444-4444-4444-8444-444444444444', code: '5932' };
const TEXTE = 'Le passage du taux annuel au taux mensuel reste flou';
const CONFUSION = 'Taux annuel divisé par 12';
const DELAI_ENTREE_MS = 20_000;

const REPONSE_ENREGISTREE = {
  questionId: BILLET_DE_SORTIE.id,
  valeur: 'b',
  correcte: false,
  score: null,
  details: null,
  libelleConfusion: CONFUSION,
};

async function installerLaSeance(page: Page, seance: SeanceDeSortie): Promise<void> {
  let repondu = false;
  await installerLaSeanceDeSortie(page, {
    seance,
    participantId: PARTICIPANT,
    jeton: 'jeton',
    etat: () =>
      repondu
        ? etatDuParticipant(seance, PARTICIPANT, 1, [REPONSE_ENREGISTREE])
        : etatDuParticipant(seance, PARTICIPANT, 0),
    flux: [ETAT_EN_COURS],
    ecritures: {
      answers: (route) => {
        repondu = true;
        return servirJson(
          route,
          { correcte: false, misconception: null, libelleConfusion: CONFUSION },
          201,
        );
      },
      'free-responses': (route) => servirJson(route, { status: 'enregistre' }, 201),
    },
  });
}

async function rejoindre(page: Page, seance: SeanceDeSortie): Promise<void> {
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

function cleDuBrouillon(seance: SeanceDeSortie): string {
  return `fp.${seance.id}.${PARTICIPANT}.fp-exit.${BILLET_DE_SORTIE.id}`;
}

async function ecrireUnBrouillon(page: Page, seance: SeanceDeSortie): Promise<void> {
  await installerLaSeance(page, seance);
  await rejoindre(page, seance);
  await page.locator('fp-exit [data-testid="texte-libre"]').fill(TEXTE);
  await expect
    .poll(() => page.evaluate((cle) => localStorage.getItem(cle), cleDuBrouillon(seance)))
    .not.toBeNull();
}

test.describe('AC-33 : reprise d’un poste étudiant rechargé', () => {
  test('restaure le brouillon, puis après envoi le verdict et le déjà répondu', async ({
    page,
  }) => {
    await ecrireUnBrouillon(page, SEANCE_A);

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
    await ecrireUnBrouillon(page, SEANCE_A);

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
