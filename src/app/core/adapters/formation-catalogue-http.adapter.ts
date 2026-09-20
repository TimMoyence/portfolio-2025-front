import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CoursCatalogue } from '../../../cours/content/types';
import { getApiBaseUrl } from '../http/api-config';
import type { FormationCataloguePort } from '../ports/formation-catalogue.port';

@Injectable()
export class FormationCatalogueHttpAdapter implements FormationCataloguePort {
  private readonly baseUrl = getApiBaseUrl() + '/formations/catalogue';

  constructor(private readonly http: HttpClient) {}

  lire(slug: string): Observable<CoursCatalogue> {
    return this.http.get<CoursCatalogue>(this.baseUrl + '/' + encodeURIComponent(slug));
  }
}
