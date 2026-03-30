import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { APP_CONFIG } from "../config/app-config.token";
import type { AppConfig } from "../config/app-config.model";
import type { CookieConsentPort } from "../ports/cookie-consent.port";
import { COOKIE_CONSENT_PORT } from "../ports/cookie-consent.port";
import { CookieConsentService } from "./cookie-consent.service";
import { LOCALE_ID } from "@angular/core";

describe("CookieConsentService", () => {
  const mockAppConfig: AppConfig = {
    production: false,
    appName: "test",
    apiBaseUrl: "http://localhost:3000",
    baseUrl: "http://localhost:4200",
    external: { presqUrl: "", sebastianUrl: "" },
    gdpr: {
      regionScope: "EU_UK",
      policyVersion: "2026-02-11",
      cookieMaxAgeDays: 365,
      termsVersion: "1.0",
    },
  };

  const mockConsentPort: jasmine.SpyObj<CookieConsentPort> =
    jasmine.createSpyObj<CookieConsentPort>("CookieConsentPort", [
      "recordConsent",
    ]);

  describe("en contexte serveur (SSR)", () => {
    let service: CookieConsentService;

    beforeEach(() => {
      mockConsentPort.recordConsent.and.returnValue(
        of({ message: "ok", httpCode: 200 }),
      );

      TestBed.configureTestingModule({
        providers: [
          CookieConsentService,
          { provide: PLATFORM_ID, useValue: "server" },
          { provide: LOCALE_ID, useValue: "fr" },
          { provide: APP_CONFIG, useValue: mockAppConfig },
          { provide: COOKIE_CONSENT_PORT, useValue: mockConsentPort },
        ],
      });

      service = TestBed.inject(CookieConsentService);
    });

    it("devrait etre cree en SSR", () => {
      expect(service).toBeTruthy();
    });

    it("shouldShowBanner devrait retourner false en SSR", () => {
      expect(service.shouldShowBanner()).toBeFalse();
    });

    it("saveConsent ne devrait pas crasher en SSR (writeConsent protege)", () => {
      expect(() => {
        service
          .saveConsent(
            {
              essential: true,
              preferences: true,
              analytics: false,
              marketing: false,
            },
            "banner",
            "accept_all",
          )
          .subscribe();
      }).not.toThrow();
    });
  });
});
