import { expect, test } from '@playwright/test';
import type { Page, Response } from '@playwright/test';
import {
  URL_API,
  avancerLePupitre,
  cloturerDepuisLePupitre,
  coursReleve,
  optionsDuPoste,
  ouvrirLePupitre,
  posteDansSonNavigateur,
  surLEcran,
  verdictDuPoste,
} from './contexte';

const ETUDIANTS = 30;

const PREMIER_RANG = 300;

const DELAI_DE_DIFFUSION_MS = 10_000;

interface Incident {
  readonly poste: string;
  readonly detail: string;
}

function surveiller(page: Page, poste: string, incidents: Incident[]): void {
  page.on('response', (reponse: Response) => {
    const refus = reponse.status() === 429 || reponse.status() >= 500;
    if (refus && new URL(reponse.url()).pathname.startsWith(new URL(URL_API).pathname)) {
      incidents.push({
        poste,
        detail: `${reponse.status()} ${reponse.request().method()} ${reponse.url()}`,
      });
    }
  });
  page.on('pageerror', (erreur) =>
    incidents.push({ poste, detail: `pageerror ${erreur.message}` }),
  );
}

type AttenteDuPoste = 'ecran' | 'options';

async function toutLeMondeSuit(
  postes: readonly Page[],
  ecran: number,
  total: number,
  attente: AttenteDuPoste,
): Promise<number> {
  const debut = Date.now();
  await Promise.all(
    postes.map(async (poste) => {
      await surLEcran(poste, ecran, total, DELAI_DE_DIFFUSION_MS);
      if (attente === 'options') {
        await expect(optionsDuPoste(poste).first()).toBeVisible({
          timeout: DELAI_DE_DIFFUSION_MS,
        });
      }
    }),
  );
  return Date.now() - debut;
}

async function toutLeMondeVote(postes: readonly Page[]): Promise<void> {
  await Promise.all(postes.map((poste) => optionsDuPoste(poste).first().click()));
  await Promise.all(postes.map((poste) => expect(verdictDuPoste(poste)).toHaveCount(1)));
}

test.describe('Banc — une classe de trente postes et son formateur sur le même wifi', () => {
  test('les trente postes suivent la séance en même temps sans refus ni erreur serveur', async ({
    browser,
    page,
    request,
  }) => {
    test.setTimeout(600_000);
    const incidents: Incident[] = [];
    surveiller(page, 'formateur', incidents);
    const { votes, total } = await coursReleve(request);
    const [premier] = votes;
    const suivant = premier.rang + 1;
    expect(suivant).toBeLessThan(total);

    const seance = await ouvrirLePupitre(page);

    const postes = await Promise.all(
      Array.from({ length: ETUDIANTS }, async (_, rang) => {
        const poste = await posteDansSonNavigateur(browser, seance, PREMIER_RANG + rang);
        surveiller(poste, `poste ${rang}`, incidents);
        return poste;
      }),
    );
    await Promise.all(
      postes.map((poste) => expect(poste.getByTestId('etudiant-attente')).toBeVisible()),
    );
    await expect(page.getByTestId('presentateur-participants-nombre')).toHaveText(
      String(ETUDIANTS),
    );

    await page.getByTestId('presentateur-demarrer').click();
    await avancerLePupitre(page, 0, premier.rang, total);
    const premiereDiffusion = await toutLeMondeSuit(postes, premier.rang, total, 'options');
    await toutLeMondeVote(postes);

    await avancerLePupitre(page, premier.rang, suivant, total);
    const secondeDiffusion = await toutLeMondeSuit(postes, suivant, total, 'ecran');

    await cloturerDepuisLePupitre(page, seance, postes);
    await expect(page.getByTestId('synthese-ligne')).toHaveCount(ETUDIANTS);

    test.info().annotations.push({
      type: 'diffusion',
      description: `premier écran ${premiereDiffusion} ms, second écran ${secondeDiffusion} ms`,
    });
    expect(incidents).toEqual([]);

    await Promise.all(postes.map((poste) => poste.context().close()));
  });
});
