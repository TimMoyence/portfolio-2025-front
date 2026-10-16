import { HttpTestingController } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { environment } from '../../../environments/environment';
import { buildPublishedArticle } from '../../../testing/factories/article.factory';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { SeoService } from '../../core/seo/seo.service';
import { HTTP_RESPONSE_STATUS } from '../../core/ssr/http-response-status';
import { ArticleDetailComponent } from './article-detail.component';

describe('ArticleDetailComponent — statut HTTP rendu côté serveur', () => {
  let statuses: number[];
  let httpMock: HttpTestingController;

  const render = (slug: string | null) => {
    statuses = [];
    setupTestBed({
      router: true,
      imports: [ArticleDetailComponent],
      providers: [
        { provide: HTTP_RESPONSE_STATUS, useValue: { set: (code: number) => statuses.push(code) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(slug ? { slug } : {}) } },
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ArticleDetailComponent);
    fixture.detectChanges();
    return fixture;
  };

  afterEach(() => httpMock.verify());

  const articleRequest = (slug: string) =>
    httpMock.expectOne((request) => request.url === `${environment.apiBaseUrl}/articles/${slug}`);

  it('répond 404 quand l API ne connaît pas le slug', () => {
    const fixture = render('inconnu');

    articleRequest('inconnu').flush(
      { message: 'Not Found' },
      { status: 404, statusText: 'Not Found' },
    );
    fixture.detectChanges();

    expect(statuses).toEqual([404]);
    expect(fixture.nativeElement.textContent).toContain('Article introuvable');
  });

  it('répond 503 quand l API est indisponible, pour ne pas figer une fausse absence', () => {
    render('morning-brief-2026-09-23');

    articleRequest('morning-brief-2026-09-23').flush(null, {
      status: 502,
      statusText: 'Bad Gateway',
    });

    expect(statuses).toEqual([503]);
  });

  it('répond 404 sans appeler l API quand le slug manque', () => {
    render(null);

    expect(statuses).toEqual([404]);
  });

  it('laisse le statut par défaut quand l article existe', () => {
    render('morning-brief-2026-09-23');

    articleRequest('morning-brief-2026-09-23').flush(
      buildPublishedArticle({ slug: 'morning-brief-2026-09-23' }),
    );

    expect(statuses).toEqual([]);
  });
});

describe('ArticleDetailComponent — URL canonique', () => {
  it('construit le canonical comme le reste du site, base terminee par un slash comprise', () => {
    setupTestBed({
      router: true,
      appConfig: { baseUrl: 'https://example.com/' },
      imports: [ArticleDetailComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'fr' },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ slug: 'veille' }) } },
        },
      ],
    });
    const seo = TestBed.inject(SeoService);
    const miseAJour = spyOn(seo, 'updateSeoMetadata');
    const httpMock = TestBed.inject(HttpTestingController);
    TestBed.createComponent(ArticleDetailComponent).detectChanges();

    httpMock
      .expectOne((request) => request.url === `${environment.apiBaseUrl}/articles/veille`)
      .flush(
        buildPublishedArticle({
          slug: 'veille',
          seo: { ...buildPublishedArticle().seo, canonical_path: '/articles/veille/' },
        }),
      );

    const config = miseAJour.calls.mostRecent().args[0];
    expect(config.canonicalUrl).toBe('https://example.com/fr/articles/veille');
    expect(config.ogUrl).toBe('https://example.com/fr/articles/veille');
    httpMock.verify();
  });
});
