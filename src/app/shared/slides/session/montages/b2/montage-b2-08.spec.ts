import { INSTANTANE_B2_08 } from '../../../../../../testing/fixtures/instantanes/b2/instantane-b2-08';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../../../testing/page/montage-d-instantane';

decrireLeMontageDeLInstantane('B2-08', INSTANTANE_B2_08, {
  ecrans: 40,
  publicsAuCatalogue: [
    'A1-01-ACCROCHE',
    'A1-02-ENFANT-PENTE',
    'A1-03-ENFANT-RECETTE',
    'A1-04-ENFANT-BOULE',
    'A1-06-ENFANT-PANNEAU',
    'A1-07-ENFANT-SOMMET',
    'A2-01-DOSSIER',
    'A2-03-ENFANT-POTAGER',
    'A2-04-COURS-PRODUIT-QUOTIENT',
    'A2-08-ENFANT-ENGRENAGES',
    'A2-09-COURS-EXP-LN',
    'A3-02-GRAPHE-TANGENTE',
    'A3-03-GRAPHE-COUT-MOYEN',
    'A3-04-COURS-COUTS',
    'A3-08-GRAPHE-MARCHE',
    'A3-09-COURS-MARCHE',
    'A4-02-GRAPHE-DROITE-K',
    'A4-03-GRAPHE-LOGISTIQUE',
    'A4-04-ENFANT-NOMBRE-SECRET',
    'A4-05-COURS-SOLUTIONS',
    'A5-02-FICHE-MEMO',
  ],
  textesAuPupitre: [
    { ecran: 'B2-08-A2-01-DOSSIER', textes: ['Le dossier de la voile Brise', 'Données fictives'] },
  ],
  specifiques: () => {
    it('TST-01 · sert au poste étudiant le dossier de l’entreprise fictive, déclaré tel', () => {
      const dossier = texteServiAuPosteEtudiant(INSTANTANE_B2_08, 'B2-08-A2-01-DOSSIER');

      expect(dossier).toContain('Le dossier de la voile Brise');
      expect(dossier).toContain('Données fictives');
    });
  },
});
