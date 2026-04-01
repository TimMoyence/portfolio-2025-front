import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import type { AuditStreamEvent } from "../models/audit-request.model";
import { AUDIT_REQUEST_PORT } from "../ports/audit-request.port";
import { AuditRequestService } from "./audit-request.service";
import {
  buildAuditRequestPayload,
  buildAuditCreateResponse,
  buildAuditSummaryResponse,
  createAuditRequestPortStub,
} from "../../../testing/factories/audit-request.factory";

describe("AuditRequestService", () => {
  let service: AuditRequestService;
  let auditPortSpy: ReturnType<typeof createAuditRequestPortStub>;

  beforeEach(() => {
    auditPortSpy = createAuditRequestPortStub();

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
    const payload = buildAuditRequestPayload();
    const response = buildAuditCreateResponse({
      message: "Audit créé avec succès.",
    });

    auditPortSpy.submit.and.returnValue(of(response));

    service.submit(payload).subscribe((result) => {
      expect(result).toEqual(response);
    });

    expect(auditPortSpy.submit).toHaveBeenCalledWith(payload);
  });

  it("should delegate getSummary to the audit port", () => {
    const summary = buildAuditSummaryResponse({
      ready: true,
      status: "COMPLETED",
      progress: 100,
      summaryText: "Rapport final",
      keyChecks: { https: true },
      quickWins: ["Ajouter des données structurées"],
      pillarScores: { seo: 80 },
    });

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
