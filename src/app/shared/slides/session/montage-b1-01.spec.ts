import { INSTANTANE_B1_01 } from '../../../../testing/fixtures/instantane-b1-01';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../testing/montage-d-instantane';

decrireLeMontageDeLInstantane('B1-01', INSTANTANE_B1_01, {
  ecrans: 37,
  publicsAuCatalogue: [
    'A1-02-ACCROCHE',
    'A1-04-DOSSIER',
    'A1-06-ILLUSTRATION-CLASSE',
    'A1-06-COURS-PROPORTION',
    'A1-07-ILLUSTRATION-PARMI',
    'A1-07-COURS-REFERENCE-TABLEUR',
    'A2-02-ILLUSTRATION-SALLE',
    'A2-02-COURS-PROPORTION-DE-PROPORTION',
    'A2-03-ILLUSTRATION-DEUX-CLASSES',
    'A2-03-COURS-TAUX-GLOBAL',
    'A3-02-ILLUSTRATION-CODE',
    'A3-02-COURS-POINTS',
    'A3-03-ILLUSTRATION-ETIQUETTE',
    'A3-03-COURS-MARGE-MARQUE',
    'A4-01-SITUATION-FESTIVAL',
    'A4-05-FICHE-MEMO',
  ],
  textesAuPupitre: [
    { ecran: 'B1-01-A1-04-DOSSIER', textes: ['Partie Libre', 'Données fictives'] },
    { ecran: 'B1-01-A1-06-COURS-PROPORTION', textes: ['Partie en haut, tout en bas'] },
    { ecran: 'B1-01-A1-07-COURS-REFERENCE-TABLEUR', textes: ['=ARRONDI(B2/$B$6*100;1)'] },
    { ecran: 'B1-01-A3-03-COURS-MARGE-MARQUE', textes: ['La marque se lit sur l’étiquette'] },
  ],
  saisiesDuPosteEtudiant: [
    {
      ecran: 'B1-01-A2-05-TABLEAU-FIDELITE',
      textes: [],
      selecteur: '[data-testid="cellule"][data-role="saisie"]',
    },
  ],
  specifiques: () => {
    it('sert au poste étudiant la mission sans geste ni conséquence, un paragraphe par personne', () => {
      const mission = texteServiAuPosteEtudiant(INSTANTANE_B1_01, 'B1-01-A1-05-MISSION');

      expect(mission).toContain('Inès Marchal');
      expect(mission).toContain('Théo');
    });
  },
});
