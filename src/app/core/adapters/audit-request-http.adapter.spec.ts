import { HttpClient } from "@angular/common/http";
import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "../config/app-config.token";
import type { AppConfig } from "../config/app-config.model";
import { AuditRequestHttpAdapter } from "./audit-request-http.adapter";

describe("AuditRequestHttpAdapter", () => {
  const mockAppConfig: AppConfig = {
    production: false,
    appName: "test",
    apiBaseUrl: "http://localhost:3000/api/v1/portfolio25/",
    baseUrl: "http://localhost:4200",
    external: { presqUrl: "", sebastianUrl: "" },
  };

  describe("en contexte serveur (SSR)", () => {
    let adapter: AuditRequestHttpAdapter;

    beforeEach(() => {
      const httpSpy = jasmine.createSpyObj<HttpClient>("HttpClient", [
        "get",
        "post",
      ]);

      TestBed.configureTestingModule({
        providers: [
          AuditRequestHttpAdapter,
          { provide: HttpClient, useValue: httpSpy },
          { provide: PLATFORM_ID, useValue: "server" },
          { provide: APP_CONFIG, useValue: mockAppConfig },
        ],
      });

      adapter = TestBed.inject(AuditRequestHttpAdapter);
    });

    it("devrait etre cree en SSR", () => {
      expect(adapter).toBeTruthy();
    });

    it("stream() devrait retourner EMPTY en SSR sans creer EventSource", (done) => {
      const result = adapter.stream("test-audit-id");
      const emissions: unknown[] = [];

      result.subscribe({
        next: (val) => emissions.push(val),
        complete: () => {
          // EMPTY complete immediatement sans emettre
          expect(emissions.length).toBe(0);
          done();
        },
        error: () => {
          fail("stream() ne devrait pas emettre d'erreur en SSR");
        },
      });
    });
  });

  describe("en contexte navigateur", () => {
    let adapter: AuditRequestHttpAdapter;

    beforeEach(() => {
      const httpSpy = jasmine.createSpyObj<HttpClient>("HttpClient", [
        "get",
        "post",
      ]);

      TestBed.configureTestingModule({
        providers: [
          AuditRequestHttpAdapter,
          { provide: HttpClient, useValue: httpSpy },
          { provide: PLATFORM_ID, useValue: "browser" },
          { provide: APP_CONFIG, useValue: mockAppConfig },
        ],
      });

      adapter = TestBed.inject(AuditRequestHttpAdapter);
    });

    it("devrait etre cree", () => {
      expect(adapter).toBeTruthy();
    });
  });
});
