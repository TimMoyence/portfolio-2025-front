import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { setupTestBed } from '../../../testing/setup-test-bed';
import type { ArticleListResponse, PublishedArticle } from '../models/article.model';
import { ArticleHttpAdapter } from './article-http.adapter';

describe('ArticleHttpAdapter', () => {
  let adapter: ArticleHttpAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    setupTestBed({ providers: [ArticleHttpAdapter] });
    adapter = TestBed.inject(ArticleHttpAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('liste les articles publics avec la locale et la limite', () => {
    const response: ArticleListResponse = { items: [], next_cursor: null };
    adapter.list('fr', 24).subscribe((result) => expect(result).toEqual(response));

    const request = httpMock.expectOne(
      (candidate) =>
        candidate.url === `${environment.apiBaseUrl}/articles` &&
        candidate.params.get('locale') === 'fr' &&
        candidate.params.get('limit') === '24',
    );
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });

  it('encode le slug avant de charger le contenu public', () => {
    const response = {
      article_id: 'morning-brief-2026-09-09-fr',
      slug: 'morning-brief-2026-09-09-ia',
      locale: 'fr',
      title: 'Une édition Morning-Brief utile',
      excerpt: 'Une édition sourcée et actionnable pour décider quoi tester ensuite.',
      tags: ['morning-brief'],
      published_at: '2026-09-09T00:00:00.000Z',
      updated_at: '2026-09-09T00:00:00.000Z',
      seo: {
        description: 'Une description éditoriale suffisamment longue.',
        canonical_path: '/articles/morning-brief-2026-09-09-ia',
      },
      content_markdown: '# Article',
      reading_time_minutes: 2,
      sections: [],
      sources: [],
      provenance: {},
    } satisfies PublishedArticle;

    adapter
      .getBySlug('morning brief/ia', 'fr')
      .subscribe((result) => expect(result).toEqual(response));

    const request = httpMock.expectOne(
      `${environment.apiBaseUrl}/articles/morning%20brief%2Fia?locale=fr`,
    );
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });
});
