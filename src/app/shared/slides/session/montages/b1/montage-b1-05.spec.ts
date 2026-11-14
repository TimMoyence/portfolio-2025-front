import { INSTANTANE_B1_05 } from '../../../../../../testing/fixtures/instantanes/b1/instantane-b1-05';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../../../testing/page/montage-d-instantane';

decrireLeMontageDeLInstantane('B1-05', INSTANTANE_B1_05, {
  ecrans: 33,
  publicsAuCatalogue: [
    'A1-02-ACCROCHE',
    'A1-04-DOSSIER',
    'A1-06-ENFANT-SERRURES',
    'A1-06-COURS-CONNECTEURS',
    'A1-07-ENFANT-PLUIE',
    'A1-07-COURS-IMPLICATION',
    'A2-02-ENFANT-PORTILLON',
    'A2-02-COURS-MORGAN',
    'A2-03-ENFANT-TOISE',
    'A2-03-COURS-PREDICATS',
    'A3-02-ENFANT-PANIER',
    'A3-02-COURS-QUANTIFICATEURS',
    'A3-03-ENFANT-CLES',
    'A3-03-COURS-ORDRE',
    'A4-02-FICHE-MEMO',
  ],
  textesAuPupitre: [
    {
      ecran: 'B1-05-A1-04-DOSSIER',
      textes: ['Les règles commerciales de Partie Libre', 'Données fictives'],
    },
  ],
  specifiques: () => {
    it('TST-01 · sert au poste étudiant le dossier de l’entreprise fictive, déclaré tel', () => {
      const dossier = texteServiAuPosteEtudiant(INSTANTANE_B1_05, 'B1-05-A1-04-DOSSIER');

      expect(dossier).toContain('Les règles commerciales de Partie Libre');
      expect(dossier).toContain('Données fictives');
    });
  },
});
