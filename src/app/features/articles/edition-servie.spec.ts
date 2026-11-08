import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { zPublishedArticleResponseDto } from '../../../../contrat/zod.gen';
import { environment } from '../../../environments/environment';
import editionServie from '../../../testing/fixtures/articles/edition-servie-2026-11-08.json';
import {
  ancresDuSommaire,
  rendreLaFiche,
  rendreLEdition,
} from '../../../testing/page/edition-rendue';
import { texteDe, textes } from '../../../testing/texte/textes-dom';
import { ArticlesListComponent } from './liste/articles-list.component';

describe('L’édition servie en prod, rendue telle quelle', () => {
  beforeAll(() => registerLocaleData(localeFr));

  const article = zPublishedArticleResponseDto.parse(editionServie);
  const faits = article.sections
    .filter((section) => section.kind === 'rubric')
    .flatMap((section) => section.items);

  const fiche = (): HTMLElement => rendreLaFiche(article);

  const une = (): HTMLElement =>
    rendreLEdition(ArticlesListComponent, article.slug, `${environment.apiBaseUrl}/articles`, {
      items: [article],
      next_cursor: null,
    }).querySelector<HTMLElement>('[data-testid="une"]')!;

  const compteurs = '37 informations · 11 sources · 11 min de lecture';

  it('titre la fiche par son décryptage, avec ses compteurs', () => {
    const page = fiche();

    expect(texteDe(page.querySelector('h1'))).toBe('V8 travaille désormais pour le temps réel');
    expect(texteDe(page.querySelector('header app-compteurs-de-l-edition'))).toBe(compteurs);
  });

  it('compte à la une comme sur la fiche', () => {
    const page = une();

    expect(texteDe(page.querySelector('h2'))).toBe('V8 travaille désormais pour le temps réel');
    expect(texteDe(page.querySelector('app-compteurs-de-l-edition'))).toBe(compteurs);
  });

  it('ouvre une ancre par partie servie, sans encadré quand le décryptage n’a pas d’item', () => {
    const page = fiche();

    expect(ancresDuSommaire(page)).toEqual([
      'mb-essential',
      'mb-deep-dive',
      'mb-modeles-ia',
      'mb-outils-ia',
      'mb-dev-frameworks',
      'mb-web-internet',
      'mb-business-niches',
      'mb-radar',
      'edition-anatomie',
      'edition-sources',
    ]);
    expect(page.querySelector('.encadre')).toBeNull();
  });

  it('met sous chaque fait le lien vers sa source', () => {
    const liens = Array.from(
      fiche().querySelectorAll<HTMLAnchorElement>('.fait [data-testid="provenance"]'),
    ).map((lien) => lien.getAttribute('href'));

    expect(liens).toEqual(faits.map((fait) => fait.url));
  });

  it('porte à la une les trois points à retenir et la bande des rubriques, radar sans rubrique à part', () => {
    const page = une();

    expect(page.querySelectorAll('.une__points li').length).toBe(3);
    expect(textes(page, '.legende__libelle')).toEqual([
      'Modèles IA & Recherche',
      'Outils IA & Agents',
      'Dev & Frameworks',
      'Web & Internet',
      'Business & Niches',
      'Autres signaux',
    ]);
  });
});
