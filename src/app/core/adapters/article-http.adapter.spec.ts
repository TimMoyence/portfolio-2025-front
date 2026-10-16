import type { TestRequest } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { buildPublishedArticle } from '../../../testing/factories/article.factory';
import { bancAdaptateurHttp } from '../../../testing/http-attendu';
import { lecturesStrictes } from '../../../testing/lecture-stricte';
import type { ArticleListResponse } from '../models/article.model';
import { ArticleHttpAdapter } from './article-http.adapter';

describe('ArticleHttpAdapter', () => {
  const banc = bancAdaptateurHttp(ArticleHttpAdapter);

  describe('lecture des réponses servies par le back', () => {
    lecturesStrictes(banc, [
      { route: 'GET /api/articles', chemin: '/articles', appel: (a) => a.list('fr') },
      {
        route: 'GET /api/articles/:slug',
        chemin: '/articles/veille',
        appel: (a) => a.getBySlug('veille', 'fr'),
      },
    ]);
  });

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
    const response = buildPublishedArticle({ slug: 'morning-brief-2026-09-09-ia' });

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
