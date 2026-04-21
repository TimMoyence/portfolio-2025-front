import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { LEAD_MAGNET_PORT } from "../../../../core/ports/lead-magnet.port";
import { createLeadMagnetPortStub } from "../../../../../testing/factories/lead-magnet.factory";
import { ToolkitAutoComponent } from "./toolkit-auto.component";

/**
 * Couvre les invariants editoriaux et SEO de la page toolkit de la
 * formation "Automatiser avec l'IA" : presence du H1, de la FAQ, du
 * formulaire de capture et du slug de formation transmis au composant
 * partage `ToolkitFormComponent` (critique pour l'attribution back-end
 * via `lead-magnets`).
 */
describe("ToolkitAutoComponent", () => {
  let component: ToolkitAutoComponent;
  let fixture: ComponentFixture<ToolkitAutoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolkitAutoComponent],
      providers: [
        { provide: LEAD_MAGNET_PORT, useValue: createLeadMagnetPortStub() },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolkitAutoComponent);
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
    expect(heading?.textContent?.toLowerCase()).toContain("workflow");
  });

  it("devrait rendre le composant toolkit-form avec le slug correct", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const form = compiled.querySelector("app-toolkit-form");
    expect(form).not.toBeNull();
    // Le slug est critique : il sert de cle metier pour le mailer
    // (template PDF, sequence drip, attribution de la conversion).
    expect(form?.getAttribute("formationSlug")).toBe("automatiser-avec-ia");
  });

  it("devrait afficher la section 'Ce que contient le toolkit'", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.toLowerCase()).toContain("ce que contient");
  });

  it("devrait afficher la FAQ (AEO / FAQPage signal)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.toLowerCase()).toContain("questions");
    const details = compiled.querySelectorAll("details, h3");
    expect(details.length).toBeGreaterThan(0);
  });

  it("devrait afficher le nom de la marque", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Asili Design");
  });
});
