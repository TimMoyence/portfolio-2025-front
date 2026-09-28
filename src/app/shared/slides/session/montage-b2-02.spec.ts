import { DELAI_DE_MONTAGE_MS, monterEcran } from '../../../../testing/briques-montees';
import { ecransDuPupitreDe } from '../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANE_B2_02 } from '../../../../testing/fixtures/instantane-b2-02';
import {
  decrireLeMontageDeLInstantane,
  ecranNomme,
} from '../../../../testing/montage-d-instantane';

decrireLeMontageDeLInstantane('B2-02', INSTANTANE_B2_02, {
  empreinte: 'b02d02833dacd5ebcaac5317f675e61f02f9d1b2c206a0b3ebb3a4005d1f98af',
  ecrans: 38,
  specifiques: () => {
    it('reprend au catalogue les huit écrans publics et verrouille les autres', () => {
      const publics = INSTANTANE_B2_02.catalogue.ecrans.filter(
        (ecran) => ecran.type !== 'ecran-verrouille',
      );

      expect(publics.map((ecran) => ecran.id.slice(6, 11))).toEqual([
        'A1-02',
        'A1-04',
        'A1-06',
        'A2-01',
        'A2-03',
        'A3-02',
        'A4-01',
        'A4-05',
      ]);
    });

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
