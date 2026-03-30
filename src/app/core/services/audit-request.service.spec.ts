import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import type {
  AuditCreateResponse,
  AuditRequestPayload,
  AuditStreamEvent,
  AuditSummaryResponse,
} from "../models/audit-request.model";
import type { AuditRequestPort } from "../ports/audit-request.port";
import { AUDIT_REQUEST_PORT } from "../ports/audit-request.port";
import { AuditRequestService } from "./audit-request.service";

describe("AuditRequestService", () => {
  let service: AuditRequestService;
  let auditPortSpy: jasmine.SpyObj<AuditRequestPort>;

  beforeEach(() => {
    auditPortSpy = jasmine.createSpyObj<AuditRequestPort>("AuditRequestPort", [
      "submit",
      "getSummary",
      "stream",
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuditRequestService,
        {
          provide: AUDIT_REQUEST_PORT,
          useValue: auditPortSpy,
        },
      ],
    });

    service = TestBed.inject(AuditRequestService);
  });

  it("should delegate submit to the audit port", () => {
    const payload: AuditRequestPayload = {
      websiteName: "example.com",
      contactMethod: "EMAIL",
      contactValue: "test@example.com",
      locale: "fr",
    };
    const response: AuditCreateResponse = {
      message: "Audit créé avec succès.",
      httpCode: 201,
      auditId: "audit-1",
      status: "PENDING",
    };

    auditPortSpy.submit.and.returnValue(of(response));

    service.submit(payload).subscribe((result) => {
      expect(result).toEqual(response);
    });

    expect(auditPortSpy.submit).toHaveBeenCalledWith(payload);
  });

  it("should delegate getSummary to the audit port", () => {
    const summary: AuditSummaryResponse = {
      auditId: "audit-1",
      ready: true,
      status: "COMPLETED",
      progress: 100,
      summaryText: "Rapport final",
      keyChecks: { https: true },
      quickWins: ["Ajouter des données structurées"],
      pillarScores: { seo: 80 },
    };

    auditPortSpy.getSummary.and.returnValue(of(summary));

    service.getSummary("audit-1").subscribe((result) => {
      expect(result).toEqual(summary);
    });

    expect(auditPortSpy.getSummary).toHaveBeenCalledWith("audit-1");
  });

  it("should delegate stream to the audit port", () => {
    const event: AuditStreamEvent = {
      type: "progress",
      data: {
        auditId: "audit-1",
        status: "RUNNING",
        progress: 50,
        step: "crawling",
        done: false,
        updatedAt: "2026-01-01T00:00:00Z",
      },
    };

    auditPortSpy.stream.and.returnValue(of(event));

    service.stream("audit-1").subscribe((result) => {
      expect(result).toEqual(event);
    });

    expect(auditPortSpy.stream).toHaveBeenCalledWith("audit-1");
  });
});
