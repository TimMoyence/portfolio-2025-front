import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CoursContent } from '../../../cours/content/types';
import { getApiBaseUrl } from '../http/api-config';
import type { FormationCataloguePort } from '../ports/formation-catalogue.port';

@Injectable()
export class FormationCatalogueHttpAdapter implements FormationCataloguePort {
  private readonly baseUrl = getApiBaseUrl() + '/formations/catalogue';

  constructor(private readonly http: HttpClient) {}

  lire(slug: string): Observable<CoursContent> {
    return this.http.get<CoursContent>(this.baseUrl + '/' + encodeURIComponent(slug));
  }
}
