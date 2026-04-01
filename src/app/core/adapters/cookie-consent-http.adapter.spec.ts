import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environnement";
import { APP_CONFIG } from "../config/app-config.token";
import type { CookieConsentPayload } from "../models/cookie-consent.model";
import type { MessageResponse } from "../models/message.response";
import { CookieConsentHttpAdapter } from "./cookie-consent-http.adapter";

describe("CookieConsentHttpAdapter", () => {
  let adapter: CookieConsentHttpAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CookieConsentHttpAdapter,
        {
          provide: APP_CONFIG,
          useValue: environment,
        },
      ],
    });

    adapter = TestBed.inject(CookieConsentHttpAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should POST consent payload to the cookie-consents endpoint", () => {
    const payload: CookieConsentPayload = {
      policyVersion: "2026-02-11",
      locale: "fr",
      region: "EU_UK",
      source: "banner",
      action: "accept_all",
      preferences: {
        essential: true,
        preferences: true,
        analytics: true,
        marketing: true,
      },
    };
    const response: MessageResponse = {
      message: "Consentement enregistré.",
      httpCode: 201,
    };

    adapter.recordConsent(payload).subscribe((result) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/cookie-consents`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(response);
  });

  it("should propagate HTTP errors", () => {
    const payload: CookieConsentPayload = {
      policyVersion: "2026-02-11",
      locale: "en",
      region: "EU_UK",
      source: "settings",
      action: "essential_only",
      preferences: {
        essential: true,
        preferences: false,
        analytics: false,
        marketing: false,
      },
    };

    adapter.recordConsent(payload).subscribe({
      next: () => fail("should have failed"),
      error: (error) => {
        expect(error.status).toBe(500);
      },
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/cookie-consents`);
    req.flush("Internal Server Error", {
      status: 500,
      statusText: "Internal Server Error",
    });
  });
});
