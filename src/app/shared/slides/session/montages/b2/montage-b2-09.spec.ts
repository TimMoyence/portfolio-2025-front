import { INSTANTANE_B2_09 } from '../../../../../../testing/fixtures/instantanes/b2/instantane-b2-09';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../../../testing/page/montage-d-instantane';

decrireLeMontageDeLInstantane('B2-09', INSTANTANE_B2_09, {
  ecrans: 40,
  publicsAuCatalogue: [
    'A1-01-ACCROCHE',
    'A1-02-ENFANT-PART',
    'A1-03-ENFANT-CONTRAIRE',
    'A1-04-ENFANT-INTERSECTION',
    'A1-06-ENFANT-REUNION',
    'A1-07-ENFANT-TABLEAU',
    'A2-01-DOSSIER',
    'A2-03-ENFANT-RUISSEAUX',
    'A2-04-ARBRE-EXEMPLE',
    'A2-05-COURS-ARBRE',
    'A2-09-ENFANT-LOUPE',
    'A2-10-COURS-TABLEAU',
    'A3-02-ARBRE-TOTALES',
    'A3-03-COURS-TOTALES',
    'A3-07-ARBRE-REMONTER',
    'A3-08-COURS-REMONTER',
    'A4-02-ARBRE-INDEPENDANT',
    'A4-03-TABLEAU-INDEPENDANT',
    'A4-04-ENFANT-PIECE',
    'A4-05-COURS-INDEPENDANCE',
    'A5-02-FICHE-MEMO',
  ],
  textesAuPupitre: [
    {
      ecran: 'B2-09-A2-04-ARBRE-EXEMPLE',
      textes: ['Le paiement sur la boutique', '0,4225', 'Lecture professionnelle'],
    },
  ],
  specifiques: () => {
    it('ARB-01 · sert au poste étudiant l’arbre de la remontée avec le produit de chaque chemin', () => {
      const arbre = texteServiAuPosteEtudiant(INSTANTANE_B2_09, 'B2-09-A3-07-ARBRE-REMONTER');

      expect(arbre).toContain('"renderer":"arbre"');
      expect(arbre).toContain('"produit":0.325');
      expect(arbre).toContain('"produit":0.07');
    });
  },
});
