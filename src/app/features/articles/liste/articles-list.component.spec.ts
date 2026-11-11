import { registerLocaleData } from '@angular/common';
import { HttpTestingController, type TestRequest } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  buildPublishedArticle,
  buildRecitDuMatin,
} from '../../../../testing/factories/article.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { texteDe } from '../../../../testing/texte/textes-dom';
import type { PublishedArticle } from '../../../core/models/article.model';
import { ArticlesListComponent } from './articles-list.component';

const summary = (day: number): PublishedArticle =>
  buildPublishedArticle({
    slug: `morning-brief-2026-09-${day}`,
    title: `Veille IA du ${day} septembre`,
    published_at: `2026-09-${day}T04:15:00.000Z`,
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
      fixture.nativeElement.querySelectorAll(
        '.une__titre, .precedente__titre',
      ) as NodeListOf<Element>,
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

  it('annonce le chargement, puis l indisponibilité quand la première page échoue', () => {
    const etat = (): string =>
      fixture.nativeElement.querySelector('p.state')?.textContent?.trim() ?? '';
    expect(etat()).toBe('Chargement des articles…');

    page(null).flush(null, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();

    expect(etat()).toBe('Les articles seront disponibles dans un instant.');
    expect(fixture.nativeElement.querySelector('p.state[role="status"]')).not.toBeNull();
    expect(titles()).toEqual([]);
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

describe('ArticlesListComponent — la une du journal', () => {
  beforeAll(() => registerLocaleData(localeFr));

  function rendre(items: PublishedArticle[]): HTMLElement {
    setupTestBed({
      router: true,
      imports: [ArticlesListComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'fr' }],
    });
    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ArticlesListComponent);
    fixture.detectChanges();
    httpMock
      .expectOne((request) => request.url === `${environment.apiBaseUrl}/articles`)
      .flush({ items, next_cursor: null });
    fixture.detectChanges();
    httpMock.verify();
    return fixture.nativeElement as HTMLElement;
  }

  const veille = buildRecitDuMatin({
    slug: 'morning-brief-2026-11-10',
    title: 'Gemini répond',
    published_at: '2026-11-10T05:15:00.000Z',
  });

  it('n a qu un h1, celui du hero ; la manchette nomme le journal en h2', () => {
    const page = rendre([buildRecitDuMatin(), veille]);

    expect(page.querySelectorAll('h1').length).toBe(1);
    expect(page.querySelector('app-asili-hero h1')).not.toBeNull();
    const manchette = page.querySelector('#articles-heading');
    expect(manchette?.tagName).toBe('H2');
    expect(
      page.querySelector('[aria-labelledby="articles-heading"]')?.contains(manchette),
    ).toBeTrue();
  });

  it('range les éditions précédentes en colonnes, titrées et liées', () => {
    const page = rendre([buildRecitDuMatin(), veille]);

    const precedentes = Array.from(page.querySelectorAll('[data-testid="edition-precedente"]'));
    expect(precedentes.length).toBe(1);
    expect(texteDe(precedentes[0].querySelector('h3'))).toBe('Gemini répond');
    expect(precedentes[0].querySelector('a')?.getAttribute('href')).toBe(
      '/articles/morning-brief-2026-11-10',
    );
  });

  it('garde le titre et le résumé d’une édition sans sections', () => {
    const une = rendre([
      buildPublishedArticle({ title: 'Veille IA', excerpt: 'Les faits.' }),
    ]).querySelector('[data-testid="une"]')!;

    expect(texteDe(une.querySelector('h2'))).toBe('Veille IA');
    expect(texteDe(une)).toContain('Les faits.');
    expect(une.querySelector('img')).toBeNull();
  });
});
