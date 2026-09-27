import { DELAI_DE_MONTAGE_MS, monterEcran } from '../../../../testing/briques-montees';
import {
  ecransDuPupitreDe,
  ecransPublicsDe,
} from '../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANE_B2_02 } from '../../../../testing/fixtures/instantane-b2-02';
import {
  decrireLeMontageDeLInstantane,
  ecranNomme,
} from '../../../../testing/montage-d-instantane';

decrireLeMontageDeLInstantane('B2-02', INSTANTANE_B2_02, {
  empreinte: 'd3d6c9086b39e7c36c209d49bc7df1f7ad0d7e0127370f17766fd24e250ecd64',
  ecrans: 62,
  specifiques: () => {
    it('reprend au catalogue les huit écrans publics et verrouille les autres', () => {
      const publics = INSTANTANE_B2_02.catalogue.ecrans.filter(
        (ecran) => ecran.type !== 'ecran-verrouille',
      );

      expect(publics.map((ecran) => ecran.id.slice(6, 11))).toEqual([
        'A1-02',
        'A1-04',
        'A1-05',
        'A1-07',
        'A1-09',
        'A2-01',
        'A4-01',
        'A6-05',
      ]);
      expect(ecransPublicsDe(INSTANTANE_B2_02).map((ecran) => ecran.id)).toContain(
        'B2-02-A4-03-BOITE-DELAIS',
      );
    });

    it(
      'dessine au pupitre les deux boîtes des vingt délais, avec et sans la facture contestée',
      async () => {
        const monte = await monterEcran(
          ecranNomme(ecransDuPupitreDe(INSTANTANE_B2_02), 'B2-02-A4-03-BOITE-DELAIS'),
          'presentateur',
        );

        expect(monte.erreurs).toEqual([]);
        expect(monte.element.textContent).toContain('146');
        monte.detruire();
      },
      DELAI_DE_MONTAGE_MS,
    );
  },
});
