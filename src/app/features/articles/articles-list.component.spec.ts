import { HttpTestingController, type TestRequest } from '@angular/common/http/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { setupTestBed } from '../../../testing/setup-test-bed';
import type { ArticleSummary } from '../../core/models/article.model';
import { ArticlesListComponent } from './articles-list.component';

const summary = (day: number): ArticleSummary => ({
  article_id: `morning-brief-2026-09-${day}-fr`,
  slug: `morning-brief-2026-09-${day}`,
  locale: 'fr',
  title: `Veille IA du ${day} septembre`,
  excerpt: 'Les faits IA du jour.',
  tags: [],
  published_at: `2026-09-${day}T04:15:00.000Z`,
  updated_at: `2026-09-${day}T04:15:00.000Z`,
  seo: { description: 'Les faits IA du jour.', canonical_path: `/articles/morning-brief-${day}` },
});

describe('ArticlesListComponent — pagination', () => {
  let fixture: ComponentFixture<ArticlesListComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    setupTestBed({ router: true, imports: [ArticlesListComponent] });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ArticlesListComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  const page = (cursor: string | null): TestRequest =>
    httpMock.expectOne(
      (request) =>
        request.url === `${environment.apiBaseUrl}/articles` &&
        request.params.get('cursor') === cursor,
    );

  const titles = (): string[] =>
    Array.from(
      fixture.nativeElement.querySelectorAll('.article-card h2') as NodeListOf<Element>,
    ).map((node) => node.textContent?.trim() ?? '');

  const loadMore = (): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector('[data-testid="articles-load-more"]');

  it('ajoute la page suivante à la suite quand le lecteur en demande plus', () => {
    page(null).flush({ items: [summary(23), summary(22)], next_cursor: 'c1' });
    fixture.detectChanges();

    loadMore()!.click();
    fixture.detectChanges();
    expect(loadMore()!.disabled).toBeTrue();
    page('c1').flush({ items: [summary(21)], next_cursor: null });
    fixture.detectChanges();

    expect(titles()).toEqual([
      'Veille IA du 23 septembre',
      'Veille IA du 22 septembre',
      'Veille IA du 21 septembre',
    ]);
    expect(loadMore()).toBeNull();
  });

  it('masque le bouton quand il n y a pas de page suivante', () => {
    page(null).flush({ items: [summary(23)], next_cursor: null });
    fixture.detectChanges();

    expect(loadMore()).toBeNull();
  });

  it('garde les articles lus et permet de réessayer si la page suivante échoue', () => {
    page(null).flush({ items: [summary(23)], next_cursor: 'c1' });
    fixture.detectChanges();

    loadMore()!.click();
    page('c1').flush(null, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();

    expect(titles()).toEqual(['Veille IA du 23 septembre']);
    expect(
      fixture.nativeElement.querySelector('[data-testid="articles-load-more-error"]'),
    ).not.toBeNull();
    loadMore()!.click();
    page('c1').flush({ items: [summary(22)], next_cursor: null });
    fixture.detectChanges();

    expect(titles().length).toBe(2);
    expect(
      fixture.nativeElement.querySelector('[data-testid="articles-load-more-error"]'),
    ).toBeNull();
  });
});
