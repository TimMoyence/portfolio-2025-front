import { INSTANTANE_B3_04 } from '../../../../../../testing/fixtures/instantanes/b3/instantane-b3-04';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../../../testing/page/montage-d-instantane';

decrireLeMontageDeLInstantane('B3-04', INSTANTANE_B3_04, {
  ecrans: 34,
  publicsAuCatalogue: [
    'A1-02-ACCROCHE',
    'A1-04-PAGE-PUBLIPOSTAGE',
    'A1-05-PAGE-SOURCE',
    'A1-08-PAGE-CHAMPS',
    'A1-09-PAGE-FORMAT',
    'A2-02-PAGE-FILTRER',
    'A2-03-PAGE-REGLE',
    'A2-06-PAGE-APERCU',
    'A2-07-PAGE-FUSION',
    'A2-08-PAGE-PDF',
    'A2-11-FICHE-RECAP',
    'A3-02-PAGE-E-MAILING',
    'A3-03-PAGE-PDF-JOINT',
    'A3-07-COURS-IA-LETTRE',
    'A3-11-FICHE-MEMO',
  ],
  textesAuPupitre: [{ ecran: 'B3-04-A1-05-PAGE-SOURCE', textes: ['Pastille 1'] }],
  specifiques: () => {
    it('PJ-01 · sert au poste étudiant le fichier des contacts à télécharger dès l’accroche', () => {
      const accroche = texteServiAuPosteEtudiant(INSTANTANE_B3_04, 'B3-04-A1-02-ACCROCHE');

      expect(accroche).toContain('/assets/cours/b3-04/B3-04_contacts.8ad93211.xlsx');
    });
  },
});
