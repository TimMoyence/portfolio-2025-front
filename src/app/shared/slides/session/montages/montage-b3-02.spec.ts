import { INSTANTANE_B3_02 } from '../../../../../testing/fixtures/instantanes/b3/instantane-b3-02';
import {
  decrireLeMontageDeLInstantane,
  texteServiAuPosteEtudiant,
} from '../../../../../testing/page/montage-d-instantane';

decrireLeMontageDeLInstantane('B3-02', INSTANTANE_B3_02, {
  ecrans: 40,
  publicsAuCatalogue: [
    'A1-02-REPRISE',
    'A1-05-FORMULES-TEXTE',
    'A1-06-FORMULES-NOMBRE',
    'A1-07-FORMULES-CONTROLE',
    'A1-10-FORMULE-RECHERCHE',
    'A1-11-FORMULES-SOMME-SI',
    'A2-02-FORMULES-JOURS-OUVRES',
    'A2-03-FORMULES-CALENDRIER',
    'A2-04-FORMULES-MEDIANE',
    'A2-07-OUTIL-TABLEAU-STRUCTURE',
    'A2-08-OUTIL-TCD',
    'A2-10-GRAPHIQUE-TROMPEUR',
    'A2-12-OUTIL-GRAPHIQUES',
    'A2-15-FORMULES-RATIOS',
    'A2-16-OUTIL-TABLEAU-DE-BORD',
    'A2-18-FICHE-RECAP-1',
    'A2-19-FICHE-RECAP-2',
    'A3-02-COURS-IA-ANALYSTE',
    'A3-03-COURS-CAHIER-DE-REGLES',
    'A3-08-FICHE-MEMO',
  ],
  textesAuPupitre: [
    {
      ecran: 'B3-02-A1-10-FORMULE-RECHERCHE',
      textes: ['Syntaxe', 'Le piège', 'Exemple', 'RECHERCHEV', '→ la clé, ici F2'],
    },
    { ecran: 'B3-02-A2-18-FICHE-RECAP-1', textes: ['RECHERCHEX', 'INDEX'] },
    { ecran: 'B3-02-A2-19-FICHE-RECAP-2', textes: ['EQUATION.RANG', 'AGREGAT'] },
    { ecran: 'B3-02-A3-03-COURS-CAHIER-DE-REGLES', textes: ['Trois contrôles'] },
  ],
  saisiesDuPosteEtudiant: [
    {
      ecran: 'B3-02-A1-13-ATELIER-RECHERCHE',
      textes: ['€'],
      selecteur: '[data-testid="champ"]',
    },
  ],
  specifiques: () => {
    it('B302-M4 · sert au poste étudiant la reprise avec l export brut du B3-01 à télécharger', () => {
      const reprise = texteServiAuPosteEtudiant(INSTANTANE_B3_02, 'B3-02-A1-02-REPRISE');

      expect(reprise).toContain('Nadia Ferrand');
      expect(reprise).toContain('/assets/cours/b3-01/B3-01_export_ventes.dfa709a7.xlsx');
    });

    it('B302-M7 · fait déclarer au poste étudiant l IA utilisée avant ses chiffres', () => {
      const analyse = texteServiAuPosteEtudiant(INSTANTANE_B3_02, 'B3-02-A3-06-ANALYSE-IA');

      expect(analyse).toContain('Quelle IA avez-vous utilisée');
      expect(analyse).toContain('binôme');
    });
  },
});
