import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { LEAD_MAGNET_PORT } from "../../../../core/ports/lead-magnet.port";
import { createLeadMagnetPortStub } from "../../../../../testing/factories/lead-magnet.factory";
import { ToolkitAuditSeoComponent } from "./toolkit-audit-seo.component";

/**
 * Couvre les invariants editoriaux et SEO de la page toolkit de la
 * formation "Audit SEO DIY" : presence du H1, de la FAQ, du formulaire
 * de capture et du slug de formation transmis au composant partage
 * `ToolkitFormComponent` (critique pour l'attribution back-end via
 * `lead-magnets`).
 */
describe("ToolkitAuditSeoComponent", () => {
  let component: ToolkitAuditSeoComponent;
  let fixture: ComponentFixture<ToolkitAuditSeoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolkitAuditSeoComponent],
      providers: [
        { provide: LEAD_MAGNET_PORT, useValue: createLeadMagnetPortStub() },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolkitAuditSeoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait etre cree", () => {
    expect(component).toBeTruthy();
  });

  it("devrait rendre le titre principal (H1)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector("h1");
    expect(heading).not.toBeNull();
    expect(heading?.textContent?.toLowerCase()).toContain("audit seo");
  });

  it("devrait rendre le toolkit-form avec le slug audit-seo-diy", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const form = compiled.querySelector("app-toolkit-form");
    expect(form).not.toBeNull();
    expect(form?.getAttribute("formationSlug")).toBe("audit-seo-diy");
  });

  it("devrait afficher la FAQ (AEO / FAQPage signal)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.toLowerCase()).toContain("questions");
    // Verifie qu'on a au moins 3 H3-questions (format AEO friendly).
    const h3Questions = compiled.querySelectorAll("h3");
    expect(h3Questions.length).toBeGreaterThanOrEqual(3);
  });

  it("devrait afficher la section 'Ce que contient le toolkit'", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.toLowerCase()).toContain("ce que contient");
  });

  it("devrait afficher le nom de la marque", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Asili Design");
  });
});
