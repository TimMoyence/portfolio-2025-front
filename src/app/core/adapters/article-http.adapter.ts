import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { getApiBaseUrl } from '../http/api-config';
import type { ArticleListResponse, PublishedArticle } from '../models/article.model';
import { luPar } from './lu-par';
import { articleServi, pageDArticlesServie } from './site-schemas';

@Injectable({ providedIn: 'root' })
export class ArticleHttpAdapter {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  list(locale: 'fr' | 'en', limit = 12, cursor?: string): Observable<ArticleListResponse> {
    let params = new HttpParams().set('locale', locale).set('limit', limit);
    if (cursor) params = params.set('cursor', cursor);
    return this.http
      .get<unknown>(`${this.baseUrl}/articles`, { params })
      .pipe(luPar(pageDArticlesServie));
  }

  getBySlug(slug: string, locale: 'fr' | 'en'): Observable<PublishedArticle> {
    const params = new HttpParams().set('locale', locale);
    return this.http
      .get<unknown>(`${this.baseUrl}/articles/${encodeURIComponent(slug)}`, { params })
      .pipe(luPar(articleServi));
  }
}
