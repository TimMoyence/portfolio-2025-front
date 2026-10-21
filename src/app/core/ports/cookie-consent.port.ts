import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CookieConsentRequestDto,
  CookieConsentResponseDto,
} from '../../../../contrat/types.gen';

export interface CookieConsentPort {
  recordConsent(payload: CookieConsentRequestDto): Observable<CookieConsentResponseDto>;
}

export const COOKIE_CONSENT_PORT = new InjectionToken<CookieConsentPort>('COOKIE_CONSENT_PORT');
