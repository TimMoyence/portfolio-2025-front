import { INSTANTANE_B2_05 } from '../../../../testing/fixtures/instantane-b2-05';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../testing/montage-d-instantane';

decrireLeMontageDeLInstantane('B2-05', INSTANTANE_B2_05, {
  ecrans: 38,
  publicsAuCatalogue: [
    'A1-02-ACCROCHE',
    'A1-04-ACQUIS',
    'A1-05-DOSSIER',
    'A1-07-ILLUSTRATION-LIVRET',
    'A1-07-COURS-INTERETS-COMPOSES',
    'A1-08-ILLUSTRATION-FUTUR-PRESENT',
    'A1-08-COURS-VALEUR-ACTUELLE',
    'A2-02-ILLUSTRATION-VERSEMENTS',
    'A2-02-COURS-ANNUITES',
    'A3-01-GRAPHIQUE',
    'A3-03-ILLUSTRATION-ANNUITE',
    'A3-03-COURS-EMPRUNT',
    'A3-04-ILLUSTRATION-COUT',
    'A3-04-COURS-COUT-TABLEUR',
    'A4-01-SITUATION-CAMIONNETTE',
    'A4-05-FICHE-MEMO',
  ],
  textesAuPupitre: [
    { ecran: 'B2-05-A1-04-ACQUIS', textes: ['B2-01', 'B2-04'] },
    { ecran: 'B2-05-A1-05-DOSSIER', textes: ['2031', 'Données fictives'] },
    { ecran: 'B2-05-A1-07-COURS-INTERETS-COMPOSES', textes: ['Cₙ'] },
    { ecran: 'B2-05-A3-03-COURS-EMPRUNT', textes: ['⁻ⁿ'] },
    { ecran: 'B2-05-A3-01-GRAPHIQUE', textes: ['Intérêts', 'Amortissement du capital'] },
  ],
  saisiesDuPosteEtudiant: [
    {
      ecran: 'B2-05-A3-07-TABLEAU-AMORTISSEMENT',
      textes: [],
      selecteur: '[data-testid="cellule"][data-role="saisie"]',
    },
  ],
  specifiques: () => {
    it('sert au poste étudiant le rappel qui nomme le B2-01 et le B2-04', () => {
      const rappel = texteServiAuPosteEtudiant(INSTANTANE_B2_05, 'B2-05-A1-04-ACQUIS');

      for (const cours of ['B2-01 · Information chiffrée', 'B2-04 · Suites']) {
        expect(rappel).toContain(cours);
      }
    });
  },
});
