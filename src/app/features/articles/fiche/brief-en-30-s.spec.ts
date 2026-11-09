import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  buildEditionRefondue,
  buildSectionDeLArticle,
} from '../../../../testing/factories/article.factory';
import { rendreLaFiche } from '../../../../testing/page/edition-rendue';
import { texteDe, textes } from '../../../../testing/texte/textes-dom';

describe('Le brief en 30 s d’une édition', () => {
  beforeAll(() => registerLocaleData(localeFr));

  it('MB-01 · ouvre sur le chiffre du jour, sa légende et sa source, puis les lignes à retenir liées à leur source', () => {
    const page = rendreLaFiche(buildEditionRefondue());
    const brief = page.querySelector<HTMLElement>('#mb-brief');

    expect(texteDe(brief?.querySelector('.brief__chiffre') ?? null)).toBe('23 points');
    expect(texteDe(brief?.querySelector('.brief__legende') ?? null)).toBe(
      'd’écart en reformulant la consigne',
    );
    expect(textes(brief ?? page, '.brief__ligne')).toEqual([
      'Une IA mal briefée se trompe autant qu’un stagiaire.',
    ]);
    expect(brief?.querySelectorAll('a[href="https://deepswe.ai/consignes"]').length).toBe(2);
    expect(page.querySelector('.edition__texte > section')?.id).toBe('mb-brief');
  });

  it('MB-01 · ne reprend pas les lignes du brief parmi les points de l’essentiel', () => {
    const ligne = 'Une IA mal briefée se trompe autant qu’un stagiaire.';
    const page = rendreLaFiche(
      buildEditionRefondue({
        sections: [
          buildSectionDeLArticle({
            id: 'essentiel',
            kind: 'essential',
            body: '- Le point du jour.',
          }),
          ...buildEditionRefondue().sections,
        ],
      }),
    );

    expect(textes(page, '.a-retenir li').filter((point) => point?.includes(ligne)).length).toBe(1);
    expect(textes(page, '.essentiel .a-retenir li')).toEqual(['1 Le point du jour.']);
  });
});
