import type { TestRequest } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { bancAdaptateurHttp } from '../../../testing/http-attendu';
import type { ArticleListResponse, PublishedArticle } from '../models/article.model';
import { ArticleHttpAdapter } from './article-http.adapter';

describe('ArticleHttpAdapter', () => {
  const banc = bancAdaptateurHttp(ArticleHttpAdapter);

  function attendreLaListe(locale: string, parametre: string, valeur: string): TestRequest {
    const request = banc.httpMock.expectOne(
      (candidate) =>
        candidate.url === `${environment.apiBaseUrl}/articles` &&
        candidate.params.get('locale') === locale &&
        candidate.params.get(parametre) === valeur,
    );
    expect(request.request.method).toBe('GET');
    return request;
  }

  it('liste les articles publics avec la locale et la limite', () => {
    const response: ArticleListResponse = { items: [], next_cursor: null };
    banc.adapter.list('fr', 24).subscribe((result) => expect(result).toEqual(response));

    attendreLaListe('fr', 'limit', '24').flush(response);
  });

  it('transmet le curseur de la page suivante', () => {
    banc.adapter.list('en', 12, 'curseur-opaque').subscribe();

    attendreLaListe('en', 'cursor', 'curseur-opaque').flush({ items: [], next_cursor: null });
  });

  it('n envoie pas de curseur pour la première page', () => {
    banc.adapter.list('fr').subscribe();

    const request = banc.httpMock.expectOne(
      `${environment.apiBaseUrl}/articles?locale=fr&limit=12`,
    );
    expect(request.request.params.has('cursor')).toBeFalse();
    request.flush({ items: [], next_cursor: null });
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

    banc.adapter
      .getBySlug('morning brief/ia', 'fr')
      .subscribe((result) => expect(result).toEqual(response));

    const request = banc.httpMock.expectOne(
      `${environment.apiBaseUrl}/articles/morning%20brief%2Fia?locale=fr`,
    );
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });
});
