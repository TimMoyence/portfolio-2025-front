import { of, BehaviorSubject } from 'rxjs';
import type { AppConfig } from '../../app/core/config/app-config.model';
import type { CookieConsentPort } from '../../app/core/ports/cookie-consent.port';
import type { CookieConsentService } from '../../app/core/services/cookie-consent.service';

export function createCookieConsentPortStub(): jasmine.SpyObj<CookieConsentPort> {
  const stub = jasmine.createSpyObj<CookieConsentPort>('CookieConsentPort', ['recordConsent']);
  stub.recordConsent.and.returnValue(of({ message: 'ok', httpCode: 200 }));
  return stub;
}

export function createMockAppConfig(overrides?: Partial<AppConfig>): AppConfig {
  return {
    production: false,
    appName: 'test',
    apiBaseUrl: 'http://localhost:3000',
    baseUrl: 'http://localhost:4200',
    external: { sebastianUrl: '' },
    gdpr: {
      regionScope: 'EU_UK',
      policyVersion: '2026-02-11',
      cookieMaxAgeDays: 365,
      termsVersion: '1.0',
    },
    ...overrides,
  };
}

export function createCookieConsentServiceStub(): jasmine.SpyObj<CookieConsentService> & {
  consentChanges$: BehaviorSubject<null>;
} {
  const consentChanges$ = new BehaviorSubject<null>(null);
  const stub = jasmine.createSpyObj<CookieConsentService>(
    'CookieConsentService',
    [
      'shouldShowBanner',
      'saveConsent',
      'withdrawConsent',
      'getPreferences',
      'getDefaultPreferences',
      'isConsentRequired',
    ],
    { consentChanges$ },
  );
  stub.shouldShowBanner.and.returnValue(false);
  stub.getPreferences.and.returnValue({
    essential: true,
    preferences: false,
    analytics: false,
    marketing: false,
  });
  stub.getDefaultPreferences.and.returnValue({
    essential: true,
    preferences: false,
    analytics: false,
    marketing: false,
  });
  stub.saveConsent.and.returnValue(of({ message: 'ok', httpCode: 201 }));
  stub.withdrawConsent.and.returnValue(of({ message: 'ok', httpCode: 201 }));
  stub.isConsentRequired.and.returnValue(true);
  return stub as jasmine.SpyObj<CookieConsentService> & {
    consentChanges$: BehaviorSubject<null>;
  };
}
