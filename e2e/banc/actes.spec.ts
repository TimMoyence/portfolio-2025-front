import { expect, test } from '@playwright/test';
import {
  CODE_DU_COURS,
  coursReleve,
  posteDansSonNavigateur,
  seanceDemarreeSurLEcran,
  servirLEcran,
} from './contexte';

const ACTES_PAR_COURS: Readonly<Record<string, readonly string[]>> = {
  'B2-01': ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'],
  'B2-02': ['A1', 'A2', 'A3', 'A4'],
};

const ACTES = ACTES_PAR_COURS[CODE_DU_COURS];

if (ACTES === undefined) {
  throw new Error(`actes du ${CODE_DU_COURS} absents du banc`);
}

const PREMIER_RANG = 60;

function acteDeLEcran(id: string): string | undefined {
  return /-(A\d+)-/.exec(id)?.[1];
}

function rangsDeLActe(ecrans: readonly string[], acte: string): readonly number[] {
  return ecrans.flatMap((id, rang) => (acteDeLEcran(id) === acte ? [rang] : []));
}

test.describe(`Banc — parcours du ${CODE_DU_COURS} acte par acte`, () => {
  test('chaque écran publié appartient à un acte parcouru par le banc', async ({ request }) => {
    const { ecrans } = await coursReleve(request);
    const horsActes = ecrans.filter((id) => !ACTES.includes(acteDeLEcran(id) ?? ''));
    expect(horsActes).toEqual([]);
  });

  for (const [numero, acte] of ACTES.entries()) {
    test(`le poste suit chaque écran de l’acte ${acte} sans erreur ni refus`, async ({
      browser,
      request,
    }) => {
      const { ecrans, total } = await coursReleve(request);
      const rangs = rangsDeLActe(ecrans, acte);
      expect(rangs.length, `aucun écran pour l’acte ${acte}`).toBeGreaterThan(0);
      const { seance, jeton } = await seanceDemarreeSurLEcran(request, rangs[0]);
      const poste = await posteDansSonNavigateur(browser, seance, PREMIER_RANG + numero);
      const erreurs: string[] = [];
      poste.on('pageerror', (erreur) => erreurs.push(erreur.message));

      for (const rang of rangs) {
        await servirLEcran(request, jeton, seance.sessionId, rang);
        await expect(poste.getByTestId('etudiant-progression')).toHaveText(
          `${rang + 1} / ${total}`,
        );
        await expect(poste.locator('app-cours-presentation')).toBeVisible();
        await expect(poste.getByTestId('etudiant-ecran-echec')).toHaveCount(0);
        await expect(poste.getByTestId('etudiant-flux-refuse')).toHaveCount(0);
      }

      expect(erreurs).toEqual([]);
      await poste.context().close();
    });
  }
});
