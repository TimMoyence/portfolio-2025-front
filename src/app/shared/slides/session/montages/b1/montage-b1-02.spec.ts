import { INSTANTANE_B1_02 } from '../../../../../../testing/fixtures/instantanes/b1/instantane-b1-02';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../../../testing/page/montage-d-instantane';

decrireLeMontageDeLInstantane('B1-02', INSTANTANE_B1_02, {
  ecrans: 32,
  publicsAuCatalogue: [
    'A1-02-ACCROCHE',
    'A1-04-DOSSIER',
    'A1-06-ILLUSTRATION-CINEMA',
    'A1-06-COURS-COEFFICIENT',
    'A1-07-ILLUSTRATION-CASQUE',
    'A1-07-COURS-HT-TTC',
    'A2-02-ILLUSTRATION-LOYER',
    'A2-02-COURS-SUCCESSIVES',
    'A2-03-ILLUSTRATION-VELO',
    'A2-03-COURS-RECIPROQUE',
    'A3-02-ILLUSTRATION-TICKET',
    'A3-02-COURS-INDICE',
    'A3-03-ILLUSTRATION-EPARGNE',
    'A3-03-COURS-TAUX-MOYEN',
    'A4-02-FICHE-MEMO',
  ],
  textesAuPupitre: [
    { ecran: 'B1-02-A1-04-DOSSIER', textes: ['Partie Libre', 'Données fictives'] },
    { ecran: 'B1-02-A1-06-COURS-COEFFICIENT', textes: ['Toujours le départ en bas'] },
    { ecran: 'B1-02-A2-03-COURS-RECIPROQUE', textes: ['Le retour n’a pas le même taux'] },
    { ecran: 'B1-02-A3-03-COURS-TAUX-MOYEN', textes: ['=PUISSANCE(C;1/n)-1'] },
  ],
  saisiesDuPosteEtudiant: [
    {
      ecran: 'B1-02-A2-05-TABLEAU-PRIX',
      textes: [],
      selecteur: '[data-testid="cellule"][data-role="saisie"]',
    },
  ],
  specifiques: () => {
    it('B102-M3 · sert au poste étudiant le tableau du sujet et le geste de recopie vers la droite', () => {
      const annale = texteServiAuPosteEtudiant(INSTANTANE_B1_02, 'B1-02-A3-05-TABLEUR-CNIL');

      expect(annale).toContain('CNIL, rapport annuel 2024');
      expect(annale).toContain('Recopier vers la droite');
    });
  },
});
