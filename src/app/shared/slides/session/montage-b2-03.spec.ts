import { DELAI_DE_MONTAGE_MS, monterEcran } from '../../../../testing/briques-montees';
import { ecransDuPupitreDe } from '../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANE_B2_03 } from '../../../../testing/fixtures/instantane-b2-03';
import {
  decrireLeMontageDeLInstantane,
  ecranNomme,
} from '../../../../testing/montage-d-instantane';

const TEXTES_AU_PUPITRE = [
  { ecran: 'B2-03-A1-04-FACTURES', textes: ['F216', 'Données fictives'] },
  { ecran: 'B2-03-A2-03-COURS-MORGAN', textes: ['Morgan'] },
] as const;

decrireLeMontageDeLInstantane('B2-03', INSTANTANE_B2_03, {
  empreinte: 'e2a2ca9ce31a1a83378c39d066a6f02c5d3f1ee5da3b573484cae0fe2affb7c8',
  ecrans: 32,
  publicsAuCatalogue: [
    'A1-02-ACCROCHE',
    'A1-04-FACTURES',
    'A1-06-COURS-CONNECTEURS',
    'A1-07-COURS-IMPLICATION',
    'A2-02-COURS-NEGATION',
    'A2-03-COURS-MORGAN',
    'A3-02-COURS-PREDICATS',
    'A3-03-COURS-QUANTIFICATEURS',
    'A4-01-SITUATION-FACTURES',
    'A4-05-FICHE-MEMO',
  ],
  specifiques: () => {
    for (const { ecran, textes } of TEXTES_AU_PUPITRE) {
      it(
        `affiche au pupitre ${ecran} avec ${textes.join(', ')}`,
        async () => {
          const monte = await monterEcran(
            ecranNomme(ecransDuPupitreDe(INSTANTANE_B2_03), ecran),
            'presentateur',
          );

          expect(monte.erreurs).toEqual([]);
          for (const texte of textes) {
            expect(monte.element.textContent).toContain(texte);
          }
          monte.detruire();
        },
        DELAI_DE_MONTAGE_MS,
      );
    }

    it(
      'monte la table de vérité du visa avec des cases V ou F',
      async () => {
        const monte = await monterEcran(
          ecranNomme(ecransDuPupitreDe(INSTANTANE_B2_03), 'B2-03-A1-09-TABLE-VERITE'),
          'etudiant',
        );

        const table = monte.montees()[0];

        expect(monte.erreurs).toEqual([]);
        expect(table.shadowRoot?.textContent).toContain('F205');
        expect(
          table.shadowRoot?.querySelectorAll('select.fp-table-build__choix').length,
        ).toBeGreaterThan(0);
        monte.detruire();
      },
      DELAI_DE_MONTAGE_MS,
    );
  },
});
