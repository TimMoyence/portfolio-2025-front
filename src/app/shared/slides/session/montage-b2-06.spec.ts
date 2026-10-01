import { INSTANTANE_B2_06 } from '../../../../testing/fixtures/instantane-b2-06';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../testing/montage-d-instantane';

decrireLeMontageDeLInstantane('B2-06', INSTANTANE_B2_06, {
  empreinte: 'b0a73a7985868e767a5a975ceb43bc9bc690b174bd1f10f9399d345635c7c38f',
  ecrans: 34,
  publicsAuCatalogue: [
    'A1-02-ACCROCHE',
    'A1-04-ACQUIS',
    'A1-05-DOSSIER',
    'A1-07-COURS-EXPONENTIELLE',
    'A1-08-COURS-MODELE-EXP',
    'A2-02-COURS-LOGARITHME',
    'A2-03-COURS-SEUIL',
    'A3-01-GRAPHIQUE',
    'A3-03-COURS-MODELE',
    'A3-04-COURS-AJUSTEMENT',
    'A4-01-SITUATION-KITS',
    'A4-05-FICHE-MEMO',
  ],
  textesAuPupitre: [
    { ecran: 'B2-06-A1-04-ACQUIS', textes: ['B2-02', 'B2-04', 'B2-05'] },
    { ecran: 'B2-06-A1-05-DOSSIER', textes: ['400e^(0,06x)', 'Données fictives'] },
    { ecran: 'B2-06-A1-07-COURS-EXPONENTIELLE', textes: ['eˣ'] },
    { ecran: 'B2-06-A2-03-COURS-SEUIL', textes: ['ln s ÷ ln q'] },
    { ecran: 'B2-06-A3-01-GRAPHIQUE', textes: ['Demande relevée'] },
  ],
  saisiesDuPosteEtudiant: [
    {
      ecran: 'B2-06-A3-06-TABLEAU-LOGARITHMES',
      textes: [],
      selecteur: '[data-testid="cellule"][data-role="saisie"]',
    },
  ],
  specifiques: () => {
    it('sert au poste étudiant le rappel qui nomme le B2-02, le B2-04 et le B2-05', () => {
      const rappel = texteServiAuPosteEtudiant(INSTANTANE_B2_06, 'B2-06-A1-04-ACQUIS');

      for (const cours of ['B2-02 · Ajustement', 'B2-04 · Suites', 'B2-05 · Placer']) {
        expect(rappel).toContain(cours);
      }
    });

    it('sert au poste étudiant le dossier des kits avec le modèle retenu', () => {
      const dossier = texteServiAuPosteEtudiant(INSTANTANE_B2_06, 'B2-06-A4-01-SITUATION-KITS');

      expect(dossier).toContain('20e^(−0,7x)');
      expect(dossier).toContain('centaines de kits');
    });
  },
});
