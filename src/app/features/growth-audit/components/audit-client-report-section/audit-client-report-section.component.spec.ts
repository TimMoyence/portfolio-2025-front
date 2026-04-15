import { TestBed } from "@angular/core/testing";
import { buildClientReport } from "../../../../../testing/factories/audit-request.factory";
import type { ClientReport } from "../../../../core/models/audit-client-report.model";
import { AuditClientReportSectionComponent } from "./audit-client-report-section.component";

describe("AuditClientReportSectionComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditClientReportSectionComponent],
    }).compileComponents();
  });

  it("devrait rendre le résumé exécutif, la matrice et la scorecard", () => {
    const fixture = TestBed.createComponent(AuditClientReportSectionComponent);
    fixture.componentInstance.clientReport = buildClientReport();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? "";

    expect(text).toContain("Votre site présente");
    expect(root.querySelector("app-engine-coverage-matrix")).toBeTruthy();
    expect(root.querySelector("app-pillar-scorecard")).toBeTruthy();
  });

  it("devrait afficher la liste des quick wins", () => {
    const fixture = TestBed.createComponent(AuditClientReportSectionComponent);
    fixture.componentInstance.clientReport = buildClientReport();
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll(
      "[data-testid='quick-win-card']",
    );
    expect(cards.length).toBe(3);
  });

  it("devrait afficher la card CTA avec un bouton accessible", () => {
    const fixture = TestBed.createComponent(AuditClientReportSectionComponent);
    fixture.componentInstance.clientReport = buildClientReport();
    fixture.detectChanges();

    const button: HTMLButtonElement | null =
      fixture.nativeElement.querySelector("[data-testid='cta-button']");
    expect(button).toBeTruthy();
    expect(button?.getAttribute("type")).toBe("button");
    expect(button?.textContent).toContain("Réserver");
  });

  it("ne crashe pas si quickWins et topFindings sont vides", () => {
    const fixture = TestBed.createComponent(AuditClientReportSectionComponent);
    const empty: ClientReport = {
      ...buildClientReport(),
      quickWins: [],
      topFindings: [],
      pillarScorecard: [],
    };
    fixture.componentInstance.clientReport = empty;
    expect(() => fixture.detectChanges()).not.toThrow();
    const cards = fixture.nativeElement.querySelectorAll(
      "[data-testid='quick-win-card']",
    );
    expect(cards.length).toBe(0);
  });
});
