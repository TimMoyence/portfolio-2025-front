import { DELAI_DE_MONTAGE_MS, monterEcran } from '../../../../testing/briques-montees';
import { ecransDuPupitreDe } from '../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANE_B2_02 } from '../../../../testing/fixtures/instantane-b2-02';
import {
  decrireLeMontageDeLInstantane,
  ecranNomme,
} from '../../../../testing/montage-d-instantane';

decrireLeMontageDeLInstantane('B2-02', INSTANTANE_B2_02, {
  empreinte: 'b8094ea53d4ecb0c338d7b8d09f4066d0359084bc8f6c63352ec146b67a2e895',
  ecrans: 37,
  publicsAuCatalogue: [
    'A1-02-ACCROCHE',
    'A1-04-FACTURES',
    'A1-06-COURS-RESUMER',
    'A1-06-ILLUSTRATION-RESUMER',
    'A1-06-COURS-ECART',
    'A1-06-ILLUSTRATION-ECART',
    'A2-01-NUAGE-RIVAGE',
    'A2-03-COURS-NUAGE',
    'A2-03-ILLUSTRATION-NUAGE',
    'A2-03-COURS-CORRELATION',
    'A2-03-ILLUSTRATION-CORRELATION',
    'A3-02-COURS-DROITE',
    'A3-02-ILLUSTRATION-DROITE',
    'A3-02-COURS-PREVOIR',
    'A3-02-ILLUSTRATION-PREVOIR',
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
      'projette au pupitre l’illustration de la droite d’ajustement, image seule',
      async () => {
        const monte = await monterEcran(
          ecranNomme(ecransDuPupitreDe(INSTANTANE_B2_02), 'B2-02-A3-02-ILLUSTRATION-DROITE'),
          'presentateur',
        );

        expect(monte.erreurs).toEqual([]);
        expect(monte.element.querySelector('app-slide-illustration img')?.getAttribute('src')).toBe(
          '/assets/cours/b2-02/v2/boutique-droite-moindres-carres.webp',
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
