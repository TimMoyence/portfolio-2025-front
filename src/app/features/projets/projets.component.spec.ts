import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ProjetsComponent } from "./projets.component";

describe("ProjetsComponent", () => {
  let component: ProjetsComponent;
  let fixture: ComponentFixture<ProjetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjetsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Le rendu browser des sections `appReveal` pose `anim-ready` sur <html>
  // (singleton partagé). On nettoie pour ne pas polluer les specs suivants.
  afterEach(() => {
    document.documentElement.classList.remove("anim-ready");
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render a single hero title (preuves, pas promesses)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll("h1");
    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent).toContain("Des preuves");
    expect(headings[0]?.textContent).toContain("promesses");
  });

  it("should compose the Asili sections (hero, projects-grid, méthode, bande CTA)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("app-asili-hero")).not.toBeNull();
    expect(compiled.querySelector("app-asili-projects-grid")).not.toBeNull();
    expect(compiled.querySelector("app-asili-method")).not.toBeNull();
    expect(compiled.querySelector("app-asili-cta-band")).not.toBeNull();
  });

  it("should render the eleven realisations from the mockup", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll(
      "app-asili-projects-grid .proj-grid .proj",
    );
    expect(cards.length).toBe(11);
    expect(component["projects"].length).toBe(11);
  });

  it("should expose the ZenFirst Vision realisation linking to the case study", () => {
    const zenfirst = component["projects"].find((p) =>
      p.title.includes("ZenFirst Vision"),
    );
    expect(zenfirst).toBeDefined();
    expect(zenfirst?.href).toBe("/client-project");
    expect(zenfirst?.tags.some((t) => t.prod)).toBe(true);
  });

  it("should render the four-step method banner (le fil rouge)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const steps = compiled.querySelectorAll(
      "app-asili-method .method-steps .step",
    );
    expect(steps.length).toBe(4);
    expect(component["methodSteps"].length).toBe(4);
  });
});
