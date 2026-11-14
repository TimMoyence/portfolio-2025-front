import { INSTANTANE_B3_03 } from '../../../../../../testing/fixtures/instantanes/b3/instantane-b3-03';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../../../testing/page/montage-d-instantane';

decrireLeMontageDeLInstantane('B3-03', INSTANTANE_B3_03, {
  ecrans: 35,
  publicsAuCatalogue: [
    'A1-02-ACCROCHE',
    'A1-04-PAGE-IMPORTER',
    'A1-05-PAGE-NETTOYER',
    'A1-08-PAGE-CARACTERES',
    'A1-09-PAGE-STYLES',
    'A1-10-PAGE-THEME',
    'A2-02-PAGE-PARAGRAPHES',
    'A2-03-PAGE-LISTES-ET-SAUTS',
    'A2-06-PAGE-EN-TETE-PIED',
    'A2-07-PAGE-MISE-EN-PAGE',
    'A2-08-PAGE-NUMEROS',
    'A2-12-PAGE-PDF',
    'A2-14-FICHE-RECAP',
    'A3-02-COURS-IA-REDACTRICE',
    'A3-03-COURS-RELIRE',
    'A3-08-FICHE-MEMO',
  ],
  textesAuPupitre: [
    {
      ecran: 'B3-03-A2-06-PAGE-EN-TETE-PIED',
      textes: ['Page : en-tête et pied de page', '15/06/2026', 'Pastille 3 → la date'],
    },
  ],
  specifiques: () => {
    it('PJ-01 · sert au poste étudiant la note brute à télécharger dès l’accroche', () => {
      const accroche = texteServiAuPosteEtudiant(INSTANTANE_B3_03, 'B3-03-A1-02-ACCROCHE');

      expect(accroche).toContain('/assets/cours/b3-03/B3-03_note_comite.8d11b9c3.txt');
    });
  },
});
