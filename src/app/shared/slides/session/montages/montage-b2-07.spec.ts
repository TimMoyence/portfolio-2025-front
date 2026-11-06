import { INSTANTANE_B2_07 } from '../../../../../testing/fixtures/instantanes/b2/instantane-b2-07';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../../testing/page/montage-d-instantane';

const ECRANS_COMME_A_CINQ_ANS = [
  'B2-07-A1-02-ENFANT-MULTIPLIER',
  'B2-07-A1-03-ENFANT-A-ET-K',
  'B2-07-A1-04-ENFANT-LN',
  'B2-07-A1-05-ENFANT-SEUIL',
  'B2-07-A1-07-ENFANT-BOUCLE',
  'B2-07-A1-08-ENFANT-TANT-QUE',
  'B2-07-A1-09-ENFANT-DEUX-CHEMINS',
  'B2-07-A2-03-ENFANT-PENTE',
  'B2-07-A2-04-ENFANT-RECETTE',
  'B2-07-A2-09-ENFANT-EXPONENTIELLE',
  'B2-07-A3-02-ENFANT-PANNEAU',
  'B2-07-A3-03-ENFANT-CARTE',
  'B2-07-A4-02-ENFANT-SOMMET',
  'B2-07-A4-03-ENFANT-BORD',
];

decrireLeMontageDeLInstantane('B2-07', INSTANTANE_B2_07, {
  ecrans: 39,
  publicsAuCatalogue: [
    'A1-01-ACCROCHE',
    'A1-02-ENFANT-MULTIPLIER',
    'A1-03-ENFANT-A-ET-K',
    'A1-04-ENFANT-LN',
    'A1-05-ENFANT-SEUIL',
    'A1-07-ENFANT-BOUCLE',
    'A1-08-ENFANT-TANT-QUE',
    'A1-09-ENFANT-DEUX-CHEMINS',
    'A2-01-DOSSIER',
    'A2-03-ENFANT-PENTE',
    'A2-04-ENFANT-RECETTE',
    'A2-05-COURS-DERIVEE',
    'A2-09-ENFANT-EXPONENTIELLE',
    'A2-10-COURS-DERIVEE-EXP',
    'A3-02-ENFANT-PANNEAU',
    'A3-03-ENFANT-CARTE',
    'A3-04-COURS-VARIATIONS',
    'A4-02-ENFANT-SOMMET',
    'A4-03-ENFANT-BORD',
    'A4-04-COURS-OPTIMUM',
    'A5-02-FICHE-MEMO',
  ],
  textesAuPupitre: [
    { ecran: 'B2-07-A2-01-DOSSIER', textes: ['360 − 12x', 'Données fictives'] },
    { ecran: 'B2-07-A2-05-COURS-DERIVEE', textes: ['f′(x) = −4x + 40'] },
    { ecran: 'B2-07-A2-10-COURS-DERIVEE-EXP', textes: ['(e^(kx))′ = k e^(kx)'] },
  ],
  saisiesDuPosteEtudiant: [
    {
      ecran: 'B2-07-A4-07-TABLEUR-BENEFICE',
      textes: ['Recopier vers le bas'],
      selecteur: '[data-testid="cellule"]',
    },
  ],
  specifiques: () => {
    it('B207-M2 · sert au poste étudiant chaque écran comme à cinq ans avec son pont vers la notation', () => {
      for (const ecran of ECRANS_COMME_A_CINQ_ANS) {
        expect(texteServiAuPosteEtudiant(INSTANTANE_B2_07, ecran)).toContain('En maths, on écrit');
      }
    });
  },
});
