import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "../config/app-config.token";
import { COOKIE_CONSENT_PORT } from "../ports/cookie-consent.port";
import { CookieConsentService } from "./cookie-consent.service";
import { LOCALE_ID } from "@angular/core";
import {
  createCookieConsentPortStub,
  createMockAppConfig,
} from "../../../testing/factories/cookie-consent.factory";

describe("CookieConsentService", () => {
  const mockAppConfig = createMockAppConfig();
  const mockConsentPort = createCookieConsentPortStub();

  describe("en contexte serveur (SSR)", () => {
    let service: CookieConsentService;

    beforeEach(() => {
      mockConsentPort.recordConsent.calls.reset();

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
