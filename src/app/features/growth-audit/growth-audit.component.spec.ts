import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { AuditStreamEvent } from "../../core/models/audit-request.model";
import { AuditRequestService } from "../../core/services/audit-request.service";
import { GrowthAuditComponent } from "./growth-audit.component";

describe("GrowthAuditComponent", () => {
  const auditServiceMock = {
    submit: jasmine.createSpy("submit").and.returnValue(
      of({
        message: "ok",
        httpCode: 201,
        auditId: "audit-id",
        status: "PENDING",
      }),
    ),
    getSummary: jasmine.createSpy("getSummary").and.returnValue(
      of({
        auditId: "audit-id",
        ready: false,
        status: "RUNNING",
        progress: 10,
        summaryText: null,
        keyChecks: {},
        quickWins: [],
        pillarScores: {},
      }),
    ),
    stream: jasmine
      .createSpy("stream")
      .and.returnValue(
        of<AuditStreamEvent>({ type: "heartbeat", data: { ts: "now" } }),
      ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrowthAuditComponent],
      providers: [{ provide: AuditRequestService, useValue: auditServiceMock }],
    }).compileComponents();
  });

  it("renders current URL and synthesis section badges from enriched progress details", () => {
    const fixture = TestBed.createComponent(GrowthAuditComponent);
    const component = fixture.componentInstance;

    (component as any).handleStreamEvent({
      type: "progress",
      data: {
        auditId: "audit-1",
        status: "RUNNING",
        progress: 72,
        step: "Recap IA des pages",
        details: {
          phase: "synthesis",
          iaTask: "synthesis",
          iaSubTask: "prioritySection",
          currentUrl: "https://example.com/pricing",
          recentCompletedUrls: [
            "https://example.com/",
            "https://example.com/about",
          ],
          sectionStatuses: {
            summary: "completed",
            prioritySection: "started",
          },
        },
        done: false,
        updatedAt: "2026-02-19T09:00:00.000Z",
      },
    });

    fixture.detectChanges();

    expect(component.auditCurrentUrl).toBe("https://example.com/pricing");
    expect(component.auditIaTask).toBe("Synthèse IA");
    expect(component.auditSectionBadges.length).toBeGreaterThan(0);
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("URL en cours");
    expect(content).toContain("https://example.com/pricing");
    expect(content).toContain("Résumé: completed");
    expect(content).toContain("Priorités: started");
  });

  it("keeps backward compatibility when progress details only expose done/total", () => {
    const fixture = TestBed.createComponent(GrowthAuditComponent);
    const component = fixture.componentInstance;

    (component as any).handleStreamEvent({
      type: "progress",
      data: {
        auditId: "audit-2",
        status: "RUNNING",
        progress: 45,
        step: "Analyse des pages",
        details: { done: 3, total: 10 },
        done: false,
        updatedAt: "2026-02-19T09:00:00.000Z",
      },
    });

    fixture.detectChanges();

    expect(component.auditStep).toContain("(3/10)");
    expect(component.auditCurrentUrl).toBe("");
    expect(component.auditSectionBadges).toEqual([]);
  });

  it("does not crash on unknown details keys", () => {
    const fixture = TestBed.createComponent(GrowthAuditComponent);
    const component = fixture.componentInstance;

    (component as any).handleStreamEvent({
      type: "progress",
      data: {
        auditId: "audit-3",
        status: "RUNNING",
        progress: 30,
        step: "Analyse",
        details: {
          foo: "bar",
          nested: { ok: true },
        },
        done: false,
        updatedAt: "2026-02-19T09:00:00.000Z",
      },
    });

    fixture.detectChanges();

    expect(component.auditPhaseLabel).toBe("");
    expect(component.auditCurrentUrl).toBe("");
    expect(component.auditRecentCompletedUrls).toEqual([]);
  });
});
