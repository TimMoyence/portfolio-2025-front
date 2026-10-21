import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CookieConsentRequestDto,
  CookieConsentResponseDto,
} from '../../../../contrat/types.gen';
import { zCookieConsentResponseDto } from '../../../../contrat/zod.gen';
import { getApiBaseUrl } from '../http/api-config';
import type { CookieConsentPort } from '../ports/cookie-consent.port';
import { luPar } from './lu-par';

@Injectable()
export class CookieConsentHttpAdapter implements CookieConsentPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  recordConsent(payload: CookieConsentRequestDto): Observable<CookieConsentResponseDto> {
    return this.http
      .post<unknown>(`${this.baseUrl}/cookie-consents`, payload)
      .pipe(luPar(zCookieConsentResponseDto));
  }
}
