import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { getApiBaseUrl } from '../http/api-config';
import type { CookieConsentPayload } from '../models/cookie-consent.model';
import type { MessageResponse } from '../models/message.response';
import type { CookieConsentPort } from '../ports/cookie-consent.port';
import { luPar } from './lu-par';
import { accuseServi } from './site-schemas';

@Injectable()
export class CookieConsentHttpAdapter implements CookieConsentPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  recordConsent(payload: CookieConsentPayload): Observable<MessageResponse> {
    return this.http
      .post<unknown>(`${this.baseUrl}/cookie-consents`, payload)
      .pipe(luPar(accuseServi));
  }
}
