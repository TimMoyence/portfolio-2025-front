import { registerLocaleData } from '@angular/common';
import { HttpTestingController, type TestRequest } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  buildEditionMorningBrief,
  buildPublishedArticle,
} from '../../../../testing/factories/article.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { texteDe, textes } from '../../../../testing/texte/textes-dom';
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

  const veille = buildEditionMorningBrief({
    slug: 'morning-brief-2026-11-07',
    published_at: '2026-11-07T04:15:00.000Z',
  });

  it('met la dernière édition à la une : décryptage en titre, rubriques, compteurs, points clés', () => {
    const une = rendre([buildEditionMorningBrief(), veille]).querySelector<HTMLElement>(
      '[data-testid="une"]',
    )!;

    expect(texteDe(une.querySelector('h2'))).toBe('V8 travaille désormais pour le temps réel');
    expect(une.querySelector('h2 a')?.getAttribute('href')).toBe(
      '/articles/morning-brief-2026-11-08',
    );
    expect(une.querySelector('[data-testid="legende-des-rubriques"]')).not.toBeNull();
    expect(texteDe(une.querySelector('app-compteurs-de-l-edition'))).toBe(
      '7 informations · 6 sources · 9 min de lecture',
    );
    expect(textes(une, '.une__points li').length).toBe(3);
  });

  it('range les éditions précédentes en colonnes, chacune avec sa bande, sans étiquettes brutes', () => {
    const page = rendre([buildEditionMorningBrief(), veille]);

    const precedentes = Array.from(page.querySelectorAll('[data-testid="edition-precedente"]'));
    expect(precedentes.length).toBe(1);
    expect(precedentes[0].querySelector('[data-testid="bande-des-rubriques"]')).not.toBeNull();
    expect(precedentes[0].querySelector('a')?.getAttribute('href')).toBe(
      '/articles/morning-brief-2026-11-07',
    );
    expect(texteDe(page)).not.toContain('modeles-ia');
  });

  it('garde le titre et le résumé d’une édition sans sections, sans bande', () => {
    const une = rendre([
      buildPublishedArticle({ title: 'Veille IA', excerpt: 'Les faits.' }),
    ]).querySelector('[data-testid="une"]')!;

    expect(texteDe(une.querySelector('h2'))).toBe('Veille IA');
    expect(texteDe(une)).toContain('Les faits.');
    expect(une.querySelector('[data-testid="bande-des-rubriques"]')).toBeNull();
  });
});
