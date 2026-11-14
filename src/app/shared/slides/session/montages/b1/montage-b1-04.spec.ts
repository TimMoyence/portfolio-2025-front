import { INSTANTANE_B1_04 } from '../../../../../../testing/fixtures/instantanes/b1/instantane-b1-04';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../../../testing/page/montage-d-instantane';

decrireLeMontageDeLInstantane('B1-04', INSTANTANE_B1_04, {
  ecrans: 33,
  publicsAuCatalogue: [
    'A1-02-ACCROCHE',
    'A1-04-DOSSIER',
    'A1-06-ENFANT-PLATEAU',
    'A1-06-COURS-NUAGE',
    'A1-07-ENFANT-BATON',
    'A1-07-COURS-DROITE',
    'A2-02-ENFANT-OISEAUX',
    'A2-02-COURS-CORRELATION',
    'A2-03-ENFANT-PLUIE',
    'A2-03-COURS-CAUSALITE',
    'A3-02-ENFANT-PIERRES',
    'A3-02-COURS-PREVOIR',
    'A3-03-ENFANT-CHAMBRANLE',
    'A3-03-COURS-SEUIL',
    'A4-02-FICHE-MEMO',
  ],
  textesAuPupitre: [
    {
      ecran: 'B1-04-A1-04-DOSSIER',
      textes: ['La publicité et les ventes du site web', 'Données fictives'],
    },
  ],
  specifiques: () => {
    it('TST-01 · sert au poste étudiant le dossier de l’entreprise fictive, déclaré tel', () => {
      const dossier = texteServiAuPosteEtudiant(INSTANTANE_B1_04, 'B1-04-A1-04-DOSSIER');

      expect(dossier).toContain('La publicité et les ventes du site web');
      expect(dossier).toContain('Données fictives');
    });
  },
});
