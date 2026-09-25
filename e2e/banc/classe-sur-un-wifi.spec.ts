import { expect, test } from '@playwright/test';
import type { Page, Response } from '@playwright/test';
import {
  URL_API,
  coursReleve,
  optionsDuPoste,
  ouvrirLePupitre,
  posteDansSonNavigateur,
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

async function avancerJusquA(pupitre: Page, depuis: number, jusqua: number, total: number) {
  for (let ecran = depuis; ecran < jusqua; ecran += 1) {
    await pupitre.getByTestId('presentateur-suivant').click();
  }
  await expect(pupitre.getByTestId('presentateur-ecran')).toHaveText(`${jusqua + 1} / ${total}`);
}

async function toutLeMondeVote(postes: readonly Page[]): Promise<number> {
  const debut = Date.now();
  await Promise.all(
    postes.map((poste) =>
      expect(optionsDuPoste(poste).first()).toBeVisible({ timeout: DELAI_DE_DIFFUSION_MS }),
    ),
  );
  const diffusion = Date.now() - debut;
  await Promise.all(postes.map((poste) => optionsDuPoste(poste).first().click()));
  await Promise.all(postes.map((poste) => expect(verdictDuPoste(poste)).toHaveCount(1)));
  return diffusion;
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
    const [premier, second] = votes;

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
    await avancerJusquA(page, 0, premier.rang, total);
    const premiereDiffusion = await toutLeMondeVote(postes);

    await avancerJusquA(page, premier.rang, second.rang, total);
    const secondeDiffusion = await toutLeMondeVote(postes);

    await page.getByTestId('presentateur-cloturer').click();
    await page.getByTestId('presentateur-cloture-confirmer').click();
    await expect(page).toHaveURL(new RegExp(`/cours/seance/${seance.sessionId}/synthese$`));
    await Promise.all(
      postes.map((poste) => expect(poste.getByTestId('etudiant-fin')).toBeVisible()),
    );
    await expect(page.getByTestId('synthese-ligne')).toHaveCount(ETUDIANTS);

    test.info().annotations.push({
      type: 'diffusion',
      description: `premier écran ${premiereDiffusion} ms, second écran ${secondeDiffusion} ms`,
    });
    expect(incidents).toEqual([]);

    await Promise.all(postes.map((poste) => poste.context().close()));
  });
});
