import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { getApiBaseUrl } from '../http/api-config';
import type {
  PresentationInteractionsResponse,
  PresentationPort,
} from '../ports/presentation.port';
import { luPar } from './lu-par';
import { interactionsServies } from './site-schemas';

@Injectable()
export class PresentationHttpAdapter implements PresentationPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  getInteractions(slug: string): Observable<PresentationInteractionsResponse> {
    return this.http
      .get<unknown>(`${this.baseUrl}/presentations/${encodeURIComponent(slug)}/interactions`)
      .pipe(luPar(interactionsServies));
  }
}
