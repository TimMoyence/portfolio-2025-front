import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ClientProjectComponent } from "./client-project.component";

describe("ClientProjectComponent", () => {
  let component: ClientProjectComponent;
  let fixture: ComponentFixture<ClientProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientProjectComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientProjectComponent);
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

  it("should render a single hero title (étude ZenFirst Vision)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll("h1");
    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent).toContain("Piloter la rentabilité");
    expect(headings[0]?.textContent).toContain("sans s'y perdre");
  });

  it("should render the case-study hero with back link, tags and méta", () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const back = compiled.querySelector(".cs-hero .cs-back");
    expect(back).not.toBeNull();
    expect(back?.getAttribute("href")).toBe("/projets");

    const tags = compiled.querySelectorAll(".cs-hero .cs-eyebrow .tag");
    expect(tags.length).toBe(component["study"].tags.length);

    const meta = compiled.querySelectorAll(".cs-meta > div");
    expect(meta.length).toBe(4);
    expect(compiled.querySelector(".cs-meta .k")?.textContent).toContain(
      "Rôle",
    );
  });

  it("should render the labelled narrative blocks (problème, clarté, solution, preuve)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const labels = Array.from(
      compiled.querySelectorAll(".cs-body .cs-block .step-label"),
    ).map((el) => el.textContent?.trim());
    expect(labels).toContain("Le problème");
    expect(labels).toContain("La clarté");
    expect(labels).toContain("La solution");
    expect(labels).toContain("La preuve");
  });

  it("should render the scope numbers and the pull quote", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const scope = compiled.querySelectorAll(".cs-scope .cs-scope-grid > div");
    expect(scope.length).toBe(4);
    expect(compiled.querySelector(".cs-scope .n")?.textContent).toContain(
      "455",
    );

    const quote = compiled.querySelector(".cs-quote");
    expect(quote).not.toBeNull();
    expect(quote?.textContent).toContain("la confiance");
  });

  it("should render the tech stack and the next-project link to /projets", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tech = compiled.querySelectorAll(".cs-tech span");
    expect(tech.length).toBe(component["study"].tech.items.length);

    const next = compiled.querySelector(".cs-next a");
    expect(next).not.toBeNull();
    expect(next?.getAttribute("href")).toBe("/projets");
    expect(next?.textContent).toContain("Musaium");
  });

  it("should compose the Asili CTA band", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("app-asili-cta-band")).not.toBeNull();
  });
});
