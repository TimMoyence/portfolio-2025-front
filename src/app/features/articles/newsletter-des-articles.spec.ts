import { LOCALE_ID, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fournirLaRoute } from '../../../testing/factories/serveur/route.factory';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { ArticleDetailComponent } from './fiche/article-detail.component';
import { ArticlesListComponent } from './liste/articles-list.component';

function champsDuBlocNewsletter(page: Type<unknown>): number {
  TestBed.resetTestingModule();
  setupTestBed({
    router: true,
    imports: [page],
    providers: [
      { provide: LOCALE_ID, useValue: 'fr' },
      fournirLaRoute({ parametres: { slug: 'veille-ia' } }),
    ],
  });
  const fixture = TestBed.createComponent(page);
  fixture.detectChanges();
  return (fixture.nativeElement as HTMLElement).querySelectorAll(
    'app-newsletter-form input[type="email"], app-newsletter-form [data-newsletter-consentement]',
  ).length;
}

describe('Bloc newsletter des articles', () => {
  it('NL-01 · la liste et la fiche des articles portent le bloc newsletter', () => {
    expect([
      champsDuBlocNewsletter(ArticlesListComponent),
      champsDuBlocNewsletter(ArticleDetailComponent),
    ]).toEqual([2, 2]);
  });
});
