import { TestBed } from "@angular/core/testing";
import type { NgForm } from "@angular/forms";
import { of } from "rxjs";
import type { AuditStreamEvent } from "../../core/models/audit-request.model";
import type { AuditRequestPort } from "../../core/ports/audit-request.port";
import { AUDIT_REQUEST_PORT } from "../../core/ports/audit-request.port";
import { GrowthAuditComponent } from "./growth-audit.component";
import {
  buildAuditCreateResponse,
  buildAuditSummaryResponse,
  buildAuditStreamHeartbeat,
  createAuditRequestPortStub,
} from "../../../testing/factories/audit-request.factory";

/**
 * Cree un mock minimal de NgForm compatible avec GrowthAuditComponent.submit().
 * Utilise jasmine.createSpyObj avec proprietes pour eviter `as unknown as`.
 */
function buildValidForm(): NgForm {
  return jasmine.createSpyObj<NgForm>("NgForm", ["resetForm"], {
    valid: true,
  });
}

/**
 * Soumet le formulaire d'audit en configurant le stream pour emettre l'evenement donne.
 * Teste le composant via son interface publique (submit → startStream → handleStreamEvent).
 */
function submitAndStream(
  component: GrowthAuditComponent,
  auditServiceMock: jasmine.SpyObj<AuditRequestPort>,
  event: AuditStreamEvent,
  auditId: string,
): void {
  auditServiceMock.submit.and.returnValue(
    of(buildAuditCreateResponse({ auditId, httpCode: 201 })),
  );
  auditServiceMock.stream.and.returnValue(of<AuditStreamEvent>(event));

  component.auditFormState = {
    websiteName: "https://example.com",
    contactMethod: "EMAIL",
    contactValue: "test@example.com",
  };

  component.submit(buildValidForm());
}

describe("GrowthAuditComponent", () => {
  const auditServiceMock = createAuditRequestPortStub();

  beforeEach(async () => {
    auditServiceMock.submit.calls.reset();
    auditServiceMock.getSummary.calls.reset();
    auditServiceMock.stream.calls.reset();

    auditServiceMock.submit.and.returnValue(
      of(buildAuditCreateResponse({ auditId: "audit-id" })),
    );
    auditServiceMock.getSummary.and.returnValue(
      of(buildAuditSummaryResponse()),
    );
    auditServiceMock.stream.and.returnValue(of(buildAuditStreamHeartbeat()));

    await TestBed.configureTestingModule({
      imports: [GrowthAuditComponent],
      providers: [{ provide: AUDIT_REQUEST_PORT, useValue: auditServiceMock }],
    }).compileComponents();
  });

  it("renders current URL and synthesis section badges from enriched progress details", () => {
    const fixture = TestBed.createComponent(GrowthAuditComponent);
    const component = fixture.componentInstance;

    submitAndStream(
      component,
      auditServiceMock,
      {
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
      },
      "audit-1",
    );

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

    submitAndStream(
      component,
      auditServiceMock,
      {
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
      },
      "audit-2",
    );

    fixture.detectChanges();

    expect(component.auditStep).toContain("(3/10)");
    expect(component.auditCurrentUrl).toBe("");
    expect(component.auditSectionBadges).toEqual([]);
  });

  it("does not crash on unknown details keys", () => {
    const fixture = TestBed.createComponent(GrowthAuditComponent);
    const component = fixture.componentInstance;

    submitAndStream(
      component,
      auditServiceMock,
      {
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
      },
      "audit-3",
    );

    fixture.detectChanges();

    expect(component.auditPhaseLabel).toBe("");
    expect(component.auditCurrentUrl).toBe("");
    expect(component.auditRecentCompletedUrls).toEqual([]);
  });
});
