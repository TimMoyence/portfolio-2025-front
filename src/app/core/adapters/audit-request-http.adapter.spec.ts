import { HttpClient } from "@angular/common/http";
import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "../config/app-config.token";
import type { AppConfig } from "../config/app-config.model";
import type {
  AuditCompletedEvent,
  AuditStreamEvent,
} from "../models/audit-request.model";
import { buildClientReport } from "../../../testing/factories/audit-request.factory";
import { AuditRequestHttpAdapter } from "./audit-request-http.adapter";

describe("AuditRequestHttpAdapter", () => {
  const mockAppConfig: AppConfig = {
    production: false,
    appName: "test",
    apiBaseUrl: "http://localhost:3000/api/v1/portfolio25/",
    baseUrl: "http://localhost:4200",
    external: { sebastianUrl: "" },
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

    it("stream() devrait transmettre clientReport dans l'evenement completed", (done) => {
      // Fake EventSource pour simuler la reception d'un event SSE 'completed'
      const listeners = new Map<string, (event: Event) => void>();
      const closeSpy = jasmine.createSpy("close");
      const fakeEventSource = {
        addEventListener: (name: string, cb: (event: Event) => void) => {
          listeners.set(name, cb);
        },
        close: closeSpy,
        onerror: null,
      };

      // Remplace temporairement le constructeur global EventSource
      const originalEventSource = (
        globalThis as unknown as { EventSource: unknown }
      ).EventSource;
      (globalThis as unknown as { EventSource: unknown }).EventSource =
        function FakeES() {
          return fakeEventSource;
        };

      const clientReport = buildClientReport();
      const completedPayload: AuditCompletedEvent = {
        auditId: "audit-99",
        status: "COMPLETED",
        progress: 100,
        done: true,
        summaryText: "OK",
        keyChecks: {},
        quickWins: [],
        pillarScores: {},
        clientReport,
        updatedAt: "2026-04-15T10:00:00.000Z",
      };

      const received: AuditStreamEvent[] = [];
      adapter.stream("audit-99").subscribe({
        next: (event) => received.push(event),
        complete: () => {
          (globalThis as unknown as { EventSource: unknown }).EventSource =
            originalEventSource;
          expect(received.length).toBe(1);
          const evt = received[0];
          expect(evt.type).toBe("completed");
          if (evt.type === "completed") {
            expect(evt.data.clientReport).toEqual(clientReport);
            expect(evt.data.auditId).toBe("audit-99");
          }
          expect(closeSpy).toHaveBeenCalled();
          done();
        },
        error: (err) => {
          (globalThis as unknown as { EventSource: unknown }).EventSource =
            originalEventSource;
          fail(`stream() ne devrait pas emettre d'erreur: ${err}`);
        },
      });

      // Simule l'arrivee du message SSE 'completed'
      const completedListener = listeners.get("completed");
      expect(completedListener).toBeDefined();
      const messageEvent = new MessageEvent("completed", {
        data: JSON.stringify(completedPayload),
      });
      completedListener?.(messageEvent);
    });
  });
});
