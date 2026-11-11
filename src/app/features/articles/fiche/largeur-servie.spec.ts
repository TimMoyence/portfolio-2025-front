import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { buildRecitDuMatin } from '../../../../testing/factories/article.factory';
import { rendreLaFiche } from '../../../../testing/page/edition-rendue';

describe('MB-10 · la fiche dessine chaque barre à la largeur que sert l API', () => {
  beforeAll(() => registerLocaleData(localeFr));

  it('MB-10 · lit la largeur servie, sans la recalculer depuis les valeurs', () => {
    const recit = buildRecitDuMatin();
    const page = rendreLaFiche(
      buildRecitDuMatin({
        sections: recit.sections.map((section) =>
          section.kind === 'sujet' && section.graphique
            ? {
                ...section,
                graphique: {
                  ...section.graphique,
                  barres: section.graphique.barres.map((barre, rang) => ({
                    ...barre,
                    largeur: [90, 60, 30][rang],
                  })),
                },
              }
            : section,
        ),
      }),
    );

    const largeurs = Array.from(page.querySelectorAll<HTMLElement>('.graphique__remplissage')).map(
      (barre) => barre.style.width,
    );
    expect(largeurs).toEqual(['90%', '60%', '30%']);
  });
});
