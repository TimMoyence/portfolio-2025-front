import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { AppConfig } from '../config/app-config.model';
import { APP_CONFIG } from '../config/app-config.token';
import { COOKIE_CONSENT_PORT } from '../ports/cookie-consent.port';
import { CookieConsentService } from './cookie-consent.service';
import { LOCALE_ID } from '@angular/core';
import {
  createCookieConsentPortStub,
  createMockAppConfig,
} from '../../../testing/factories/cookie-consent.factory';

interface MontageConsentement {
  readonly plateforme: 'server' | 'browser';
  readonly locale?: string;
  readonly config?: AppConfig;
  readonly port?: ReturnType<typeof createCookieConsentPortStub>;
}

function serviceDeConsentement({
  plateforme,
  locale = 'fr',
  config = createMockAppConfig(),
  port = createCookieConsentPortStub(),
}: MontageConsentement): CookieConsentService {
  TestBed.configureTestingModule({
    providers: [
      CookieConsentService,
      { provide: PLATFORM_ID, useValue: plateforme },
      { provide: LOCALE_ID, useValue: locale },
      { provide: APP_CONFIG, useValue: config },
      { provide: COOKIE_CONSENT_PORT, useValue: port },
    ],
  });
  return TestBed.inject(CookieConsentService);
}

describe('CookieConsentService', () => {
  describe('en contexte serveur (SSR)', () => {
    let service: CookieConsentService;
    let mockConsentPort: ReturnType<typeof createCookieConsentPortStub>;

    beforeEach(() => {
      mockConsentPort = createCookieConsentPortStub();
      service = serviceDeConsentement({ plateforme: 'server', port: mockConsentPort });
    });

    it('devrait etre cree en SSR', () => {
      expect(service).toBeTruthy();
    });

    it('shouldShowBanner devrait retourner false en SSR', () => {
      expect(service.shouldShowBanner()).toBeFalse();
    });

    it('saveConsent ne devrait pas crasher en SSR (writeConsent protege)', () => {
      expect(() => {
        service
          .saveConsent(
            {
              essential: true,
              preferences: true,
              analytics: false,
              marketing: false,
            },
            'banner',
            'accept_all',
          )
          .subscribe();
      }).not.toThrow();
    });

    it('isConsentRequired devrait retourner true pour EU_UK + fr', () => {
      expect(service.isConsentRequired()).toBeTrue();
    });

    it('getPreferences devrait retourner les preferences par defaut', () => {
      const prefs = service.getPreferences();
      expect(prefs.essential).toBeTrue();
      expect(prefs.preferences).toBeFalse();
      expect(prefs.analytics).toBeFalse();
      expect(prefs.marketing).toBeFalse();
    });

    it('getDefaultPreferences devrait retourner les valeurs par defaut', () => {
      const prefs = service.getDefaultPreferences();
      expect(prefs.essential).toBeTrue();
      expect(prefs.preferences).toBeFalse();
    });

    it('consentChanges$ devrait emettre null initialement en SSR', (done: DoneFn) => {
      service.consentChanges$.subscribe((value) => {
        expect(value).toBeNull();
        done();
      });
    });

    it('withdrawConsent devrait deleguer a saveConsent avec les preferences par defaut', () => {
      service.withdrawConsent().subscribe();
      expect(mockConsentPort.recordConsent).toHaveBeenCalled();
    });
  });

  describe('en contexte navigateur', () => {
    let service: CookieConsentService;
    let mockConsentPort: ReturnType<typeof createCookieConsentPortStub>;

    beforeEach(() => {
      document.cookie = 'moyence_cookie_consent=; Max-Age=0; Path=/; SameSite=Lax';
      mockConsentPort = createCookieConsentPortStub();
      service = serviceDeConsentement({ plateforme: 'browser', port: mockConsentPort });
    });

    afterEach(() => {
      document.cookie = 'moyence_cookie_consent=; Max-Age=0; Path=/; SameSite=Lax';
    });

    it('devrait etre cree dans le navigateur', () => {
      expect(service).toBeTruthy();
    });

    it('shouldShowBanner devrait retourner true quand pas de cookie', () => {
      expect(service.shouldShowBanner()).toBeTrue();
    });

    it('saveConsent devrait ecrire le cookie et notifier le subject', () => {
      let emittedState: unknown;
      service.consentChanges$.subscribe((state) => {
        emittedState = state;
      });

      service
        .saveConsent(
          {
            essential: true,
            preferences: true,
            analytics: true,
            marketing: true,
          },
          'banner',
          'accept_all',
        )
        .subscribe();

      expect(emittedState).not.toBeNull();
      expect(mockConsentPort.recordConsent).toHaveBeenCalled();
      expect(document.cookie).toContain('moyence_cookie_consent');
    });

    it('saveConsent devrait normaliser les preferences (analytics/marketing toujours false)', () => {
      service
        .saveConsent(
          {
            essential: true,
            preferences: true,
            analytics: true,
            marketing: true,
          },
          'settings',
          'save_preferences',
        )
        .subscribe();

      const payload = mockConsentPort.recordConsent.calls.mostRecent().args[0];
      expect(payload.preferences.analytics).toBeFalse();
      expect(payload.preferences.marketing).toBeFalse();
      expect(payload.preferences.essential).toBeTrue();
    });

    it('shouldShowBanner devrait retourner false apres saveConsent', () => {
      service
        .saveConsent(
          {
            essential: true,
            preferences: false,
            analytics: false,
            marketing: false,
          },
          'banner',
          'essential_only',
        )
        .subscribe();

      expect(service.shouldShowBanner()).toBeFalse();
    });

    it('getPreferences devrait retourner les preferences stockees apres saveConsent', () => {
      service
        .saveConsent(
          {
            essential: true,
            preferences: true,
            analytics: false,
            marketing: false,
          },
          'banner',
          'accept_all',
        )
        .subscribe();

      const prefs = service.getPreferences();
      expect(prefs.essential).toBeTrue();
      expect(prefs.preferences).toBeTrue();
    });
  });

  describe('isConsentRequired avec differentes configs', () => {
    it('devrait retourner false si regionScope n est pas EU_UK', () => {
      const config = createMockAppConfig({
        gdpr: {
          regionScope: 'US' as 'EU_UK',
          policyVersion: '2026-02-11',
          cookieMaxAgeDays: 365,
          termsVersion: '1.0',
        },
      });

      const svc = serviceDeConsentement({ plateforme: 'server', config });
      expect(svc.isConsentRequired()).toBeFalse();
    });

    it('devrait retourner true pour locale en', () => {
      const svc = serviceDeConsentement({ plateforme: 'server', locale: 'en' });
      expect(svc.isConsentRequired()).toBeTrue();
    });

    it('devrait retourner false pour une locale non eligible', () => {
      const svc = serviceDeConsentement({ plateforme: 'server', locale: 'de' });
      expect(svc.isConsentRequired()).toBeFalse();
    });
  });
});
