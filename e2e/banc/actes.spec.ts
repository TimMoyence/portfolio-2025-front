import { expect, test } from '@playwright/test';
import {
  coursReleve,
  posteDansSonNavigateur,
  seanceDemarreeSurLEcran,
  servirLEcran,
} from './contexte';

const ACTES = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'] as const;

const PREMIER_RANG = 60;

function rangsDeLActe(ecrans: readonly string[], acte: string): readonly number[] {
  return ecrans.flatMap((id, rang) => (id.includes(`-${acte}-`) ? [rang] : []));
}

test.describe('Banc — parcours du B2-01 acte par acte', () => {
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
