import { INSTANTANE_B1_03 } from '../../../../../testing/fixtures/instantanes/b1/instantane-b1-03';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../../testing/page/montage-d-instantane';

decrireLeMontageDeLInstantane('B1-03', INSTANTANE_B1_03, {
  ecrans: 32,
  publicsAuCatalogue: [
    'A1-02-ACCROCHE',
    'A1-04-DOSSIER',
    'A1-06-ENFANT-TAS',
    'A1-06-COURS-TCD',
    'A1-07-ENFANT-LIMONADE',
    'A1-07-COURS-CHAMP-CALCULE',
    'A2-02-ENFANT-FILE',
    'A2-02-COURS-MEDIANE-QUARTILES',
    'A2-03-ENFANT-EQUIPES',
    'A2-03-COURS-ECART-TYPE',
    'A3-02-ENFANT-BOITE',
    'A3-02-COURS-BOITE',
    'A3-03-ENFANT-BILLES',
    'A3-03-COURS-CLASSES',
    'A4-02-FICHE-MEMO',
  ],
  textesAuPupitre: [
    { ecran: 'B1-03-A1-04-DOSSIER', textes: ['Partie Libre', 'Données fictives'] },
    {
      ecran: 'B1-03-A1-06-ENFANT-TAS',
      textes: ['Un tas par couleur', 'Un tas par couleur → une ligne du TCD par canal'],
    },
    { ecran: 'B1-03-A1-07-COURS-CHAMP-CALCULE', textes: ['Le calcul se fait sur les sommes'] },
    { ecran: 'B1-03-A2-02-COURS-MEDIANE-QUARTILES', textes: ['D’abord ranger, puis couper'] },
  ],
  specifiques: () => {
    it('B103-M3 · sert au poste étudiant le geste de recopie vers la droite des résumés', () => {
      const feuille = texteServiAuPosteEtudiant(INSTANTANE_B1_03, 'B1-03-A2-06-TABLEUR-PANIERS');

      expect(feuille).toContain('ECARTYPEP');
      expect(feuille).toContain('Recopier vers la droite');
    });
  },
});
