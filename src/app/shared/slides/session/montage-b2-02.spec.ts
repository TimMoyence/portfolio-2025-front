import { DELAI_DE_MONTAGE_MS, monterEcran } from '../../../../testing/briques-montees';
import { ecransDuPupitreDe } from '../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANE_B2_02 } from '../../../../testing/fixtures/instantane-b2-02';
import {
  decrireLeMontageDeLInstantane,
  ecranNomme,
} from '../../../../testing/montage-d-instantane';

decrireLeMontageDeLInstantane('B2-02', INSTANTANE_B2_02, {
  empreinte: 'ac94e40b9a56541c58f15fd819b74eabcb7265fb00d0747d7988ea375eb3fff7',
  ecrans: 31,
  publicsAuCatalogue: [
    'A1-02-ACCROCHE',
    'A1-04-FACTURES',
    'A1-06-COURS-RESUMER',
    'A1-06-COURS-ECART',
    'A2-01-NUAGE-RIVAGE',
    'A2-03-COURS-NUAGE',
    'A2-03-COURS-CORRELATION',
    'A3-02-COURS-DROITE',
    'A3-02-COURS-PREVOIR',
    'A4-01-SITUATION-FIBRE',
    'A4-05-FICHE-MEMO',
  ],
  specifiques: () => {
    it(
      'dessine au pupitre le nuage des six années d’Atelier Rivage',
      async () => {
        const monte = await monterEcran(
          ecranNomme(ecransDuPupitreDe(INSTANTANE_B2_02), 'B2-02-A2-01-NUAGE-RIVAGE'),
          'presentateur',
        );

        expect(monte.erreurs).toEqual([]);
        expect(monte.element.querySelectorAll('[data-testid="slide-scatter-point"]').length).toBe(
          6,
        );
        monte.detruire();
      },
      DELAI_DE_MONTAGE_MS,
    );

    it(
      'pose au pupitre la trace écrite du cours sur la droite d’ajustement',
      async () => {
        const monte = await monterEcran(
          ecranNomme(ecransDuPupitreDe(INSTANTANE_B2_02), 'B2-02-A3-02-COURS-DROITE'),
          'presentateur',
        );

        expect(monte.erreurs).toEqual([]);
        expect(monte.element.textContent?.trim().length).toBeGreaterThan(0);
        monte.detruire();
      },
      DELAI_DE_MONTAGE_MS,
    );
  },
});
