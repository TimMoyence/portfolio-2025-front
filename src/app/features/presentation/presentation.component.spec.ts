import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { PresentationComponent } from "./presentation.component";

describe("PresentationComponent", () => {
  let component: PresentationComponent;
  let fixture: ComponentFixture<PresentationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PresentationComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PresentationComponent);
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

  it("should render a single dev-forward hero title", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll("h1");
    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent).toContain("Développeur full-stack & IA.");
  });

  it("should compose the Asili sections (hero, méthode IA, bande CTA)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("app-asili-hero")).not.toBeNull();
    expect(compiled.querySelector("app-asili-ai-method")).not.toBeNull();
    expect(compiled.querySelector("app-asili-cta-band")).not.toBeNull();
  });

  it("should render the three expertise skills", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const skills = compiled.querySelectorAll(".skills-grid .skill");
    expect(skills.length).toBe(3);
  });

  it("should render the career timeline milestones", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll(".timeline .tl-item");
    expect(items.length).toBe(component["milestones"].length);
  });

  it("should render an SSR-safe FAQ with FAQPage microdata", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const faq = compiled.querySelector(
      '.faq[itemtype="https://schema.org/FAQPage"]',
    );
    expect(faq).not.toBeNull();
    const questions = compiled.querySelectorAll(".faq details.faq-item");
    expect(questions.length).toBe(component["faqItems"].length);
  });
});
