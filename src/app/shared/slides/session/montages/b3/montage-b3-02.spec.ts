import {
  DELAI_DE_MONTAGE_MS,
  monterEcran,
} from '../../../../../../testing/briques/briques-montees';
import { ecransDuPupitreDe } from '../../../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANE_B3_02 } from '../../../../../../testing/fixtures/instantanes/b3/instantane-b3-02';
import {
  decrireLeMontageDeLInstantane,
  ecranNomme,
  texteServiAuPosteEtudiant,
} from '../../../../../../testing/page/montage-d-instantane';

async function monterAuPupitre(id: string): Promise<Awaited<ReturnType<typeof monterEcran>>> {
  return monterEcran(ecranNomme(ecransDuPupitreDe(INSTANTANE_B3_02), id), 'presentateur');
}

decrireLeMontageDeLInstantane('B3-02', INSTANTANE_B3_02, {
  ecrans: 36,
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

    for (const [ecran, rang, fonctions] of [
      ['B3-02-A2-18-FICHE-RECAP-1', 1, ['RECHERCHEX', 'INDEX']],
      ['B3-02-A2-19-FICHE-RECAP-2', 2, ['EQUATION.RANG', 'AGREGAT']],
    ] as const) {
      it(
        `projette au pupitre la fiche récap ${rang} en page A4, texte alternatif complet`,
        async () => {
          const monte = await monterAuPupitre(ecran);
          const image = monte.element.querySelector('img');

          expect(monte.erreurs).toEqual([]);
          expect(image?.getAttribute('src')).toBe(
            `/assets/cours/b3-02/v1/fiche-recap-${rang}.webp`,
          );
          for (const fonction of fonctions) {
            expect(image?.getAttribute('alt')).toContain(fonction);
          }
          monte.detruire();
        },
        DELAI_DE_MONTAGE_MS,
      );
    }

    it(
      'B302-M7 · projette au pupitre le prompt de l IA analyste à copier, sans saisie',
      async () => {
        const monte = await monterAuPupitre('B3-02-A3-04-PROMPT-TOUS-ENSEMBLE');

        expect(monte.erreurs).toEqual([]);
        expect(monte.element.querySelector('pre')?.textContent).toContain('Le classeur joint');
        expect(monte.element.querySelector('button')?.textContent?.trim()).toBe('Copier le prompt');
        expect(monte.element.querySelector('textarea, input')).toBeNull();
        monte.detruire();
      },
      DELAI_DE_MONTAGE_MS,
    );
  },
});
