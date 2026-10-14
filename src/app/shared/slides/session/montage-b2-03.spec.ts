import { INSTANTANE_B2_03 } from '../../../../testing/fixtures/instantane-b2-03';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../testing/montage-d-instantane';

decrireLeMontageDeLInstantane('B2-03', INSTANTANE_B2_03, {
  empreinte: '5f0ef57f6882edd981b99b9fc8d4f045f059ca1f2ae34db1126567467c5cacef',
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
  textesAuPupitre: [
    { ecran: 'B2-03-A1-04-FACTURES', textes: ['F216', 'Données fictives'] },
    { ecran: 'B2-03-A2-03-COURS-MORGAN', textes: ['Morgan'] },
  ],
  saisiesDuPosteEtudiant: [
    {
      ecran: 'B2-03-A1-09-TABLE-VERITE',
      textes: ['F205'],
      selecteur: 'select.fp-table-build__choix',
    },
  ],
  specifiques: () => {
    it('sert au poste étudiant les seize factures, de F201 à F216', () => {
      const factures = texteServiAuPosteEtudiant(INSTANTANE_B2_03, 'B2-03-A1-04-FACTURES');

      expect([...(factures.match(/F2\d\d/g) ?? [])]).toEqual(
        Array.from({ length: 16 }, (_, rang) => `F${201 + rang}`),
      );
    });
  },
});
