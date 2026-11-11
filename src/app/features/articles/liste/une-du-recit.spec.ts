import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { environment } from '../../../../environments/environment';
import { buildRecitDuMatin } from '../../../../testing/factories/article.factory';
import { rendreLEdition } from '../../../../testing/page/edition-rendue';
import { texteDe } from '../../../../testing/texte/textes-dom';
import { ArticlesListComponent } from './articles-list.component';

describe('MB-19 · la une de la liste présente le récit du matin', () => {
  beforeAll(() => registerLocaleData(localeFr));

  const une = (): HTMLElement => {
    const article = buildRecitDuMatin();
    return rendreLEdition(
      ArticlesListComponent,
      article.slug,
      `${environment.apiBaseUrl}/articles`,
      {
        items: [article],
        next_cursor: null,
      },
    ).querySelector<HTMLElement>('[data-testid="une"]')!;
  };

  it('MB-19 · porte le titre, le chapô et l image du sujet du jour avec son crédit', () => {
    const page = une();

    expect(texteDe(page.querySelector('h2'))).toBe('Claude vise les gros chantiers');
    expect(texteDe(page.querySelector('.une__chapeau'))).toBe(
      'Anthropic pousse ses agents sur des tâches de plusieurs heures.',
    );
    expect(page.querySelector('img')?.getAttribute('src')).toBe(
      'https://cdn.anthropic.com/une.jpg',
    );
    expect(texteDe(page.querySelector('figcaption'))).toBe('© Anthropic');
  });

  it('MB-19 · ne montre ni compteurs, ni points à retenir', () => {
    const texte = texteDe(une());

    expect(texte).not.toContain('informations ·');
    expect(texte).not.toContain('À retenir');
  });
});
