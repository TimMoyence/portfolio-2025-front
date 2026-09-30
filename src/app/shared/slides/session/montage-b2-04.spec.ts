import { INSTANTANE_B2_04 } from '../../../../testing/fixtures/instantane-b2-04';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../testing/montage-d-instantane';

decrireLeMontageDeLInstantane('B2-04', INSTANTANE_B2_04, {
  empreinte: '2c897761c4eb24ded9b7e27110d608081a95c9bfe49fd11f70601fab984090a8',
  ecrans: 34,
  publicsAuCatalogue: [
    'A1-02-ACCROCHE',
    'A1-04-ACQUIS',
    'A1-05-HISTORIQUE',
    'A1-07-COURS-ARITHMETIQUE',
    'A1-08-COURS-RAISON-TABLEUR',
    'A2-02-COURS-GEOMETRIQUE',
    'A2-03-COURS-VARIATION',
    'A3-01-GRAPHIQUE',
    'A3-03-COURS-SEUIL',
    'A3-04-COURS-SOMME',
    'A4-01-SITUATION-BOUTIQUE',
    'A4-05-FICHE-MEMO',
  ],
  textesAuPupitre: [
    { ecran: 'B2-04-A1-04-ACQUIS', textes: ['B2-01', 'B2-02', 'B2-03'] },
    { ecran: 'B2-04-A1-05-HISTORIQUE', textes: ['826', 'Données fictives'] },
    { ecran: 'B2-04-A1-07-COURS-ARITHMETIQUE', textes: ['uₙ'] },
    { ecran: 'B2-04-A2-02-COURS-GEOMETRIQUE', textes: ['qⁿ'] },
    { ecran: 'B2-04-A3-01-GRAPHIQUE', textes: ['Hypothèse A', 'Hypothèse B'] },
  ],
  saisiesDuPosteEtudiant: [
    {
      ecran: 'B2-04-A3-06-TABLEAU-ALGORITHME',
      textes: [],
      selecteur: '[data-testid="cellule"][data-role="saisie"]',
    },
  ],
  specifiques: () => {
    it('sert au poste étudiant le rappel qui nomme les trois premiers cours', () => {
      const rappel = texteServiAuPosteEtudiant(INSTANTANE_B2_04, 'B2-04-A1-04-ACQUIS');

      for (const cours of [
        'B2-01 · Information chiffrée',
        'B2-02 · Statistiques',
        'B2-03 · Logique',
      ]) {
        expect(rappel).toContain(cours);
      }
    });
  },
});
