import { TestBed } from '@angular/core/testing';
import type { PublishedArticle } from '../../../core/models/article.model';
import {
  buildEditionMorningBrief,
  buildItemDeSection,
  buildSectionDeLArticle,
} from '../../../../testing/factories/article.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { texteDe as texte } from '../../../../testing/texte/textes-dom';
import { AnatomieComponent } from './anatomie.component';

function rendre(article: PublishedArticle): HTMLElement {
  setupTestBed({ http: false, imports: [AnatomieComponent] });
  const fixture = TestBed.createComponent(AnatomieComponent);
  fixture.componentRef.setInput('article', article);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('AnatomieComponent — l’édition en figures accessibles', () => {
  it('donne les chiffres clés : informations, sources, minutes, part publiée dans les 24 h', () => {
    const page = rendre(buildEditionMorningBrief());

    const chiffres = Array.from(page.querySelectorAll('[data-testid="chiffres-cles"] > div')).map(
      (bloc) => [texte(bloc.querySelector('dt')), texte(bloc.querySelector('dd'))],
    );
    expect(chiffres).toEqual([
      ['Informations', '7'],
      ['Sources', '6'],
      ['Minutes de lecture', '9'],
      ['Publiées dans les 24 h', '67 %'],
    ]);
  });

  it('fait de chaque graphique une figure légendée, en image nommée', () => {
    const page = rendre(buildEditionMorningBrief());

    const figures = Array.from(page.querySelectorAll('figure'));
    expect(figures.map((figure) => texte(figure.querySelector('figcaption')))).toEqual([
      'Répartition par rubrique',
      'D’où viennent les informations',
    ]);
    expect(figures[0].querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      'Modèles IA & Recherche 4, Outils IA & Agents 1, Autres signaux 1',
    );
    expect(figures[1].querySelector('[role="img"]')?.getAttribute('aria-label')).toContain(
      'Vercel Blog 2',
    );
  });

  it('annonce chaque graphique une seule fois : ni tableau en double, ni titre répété', () => {
    const page = rendre(buildEditionMorningBrief());

    for (const figure of Array.from(page.querySelectorAll('figure'))) {
      expect(figure.querySelector('table')).toBeNull();
      expect(figure.querySelectorAll('[role="img"]').length).toBe(1);
      expect(figure.querySelector('[role="img"]')?.getAttribute('aria-label')).not.toContain(
        texte(figure.querySelector('figcaption')),
      );
    }
  });

  it('rapporte chaque barre à la plus grande part', () => {
    const page = rendre(buildEditionMorningBrief());

    const largeurs = Array.from(
      page.querySelectorAll<HTMLElement>('[data-testid="figure-rubriques"] .barre__valeur'),
    ).map((barre) => barre.style.width);
    expect(largeurs).toEqual(['100%', '25%', '25%']);
  });

  it('tait la part des 24 h quand aucune information n’est datée', () => {
    const page = rendre(
      buildEditionMorningBrief({
        sections: [
          buildSectionDeLArticle({ items: [buildItemDeSection({ published_at: undefined })] }),
        ],
      }),
    );

    expect(texte(page.querySelector('[data-testid="chiffres-cles"]'))).not.toContain('24 h');
  });

  it('rassemble les publications au-delà des six premières', () => {
    const items = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((nom, rang) =>
      buildItemDeSection({ source: nom, url: `https://exemple.fr/${rang}` }),
    );
    const page = rendre(
      buildEditionMorningBrief({ sections: [buildSectionDeLArticle({ items })] }),
    );

    const lignes = Array.from(
      page.querySelectorAll('[data-testid="figure-publications"] .barre'),
    ).map((barre) => [
      texte(barre.querySelector('.barre__nom')),
      texte(barre.querySelector('.barre__nombre')),
    ]);
    expect(lignes.at(-1)).toEqual(['2 autres publications', '2']);
  });
});
