import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { OfferComponent } from "./offer.component";

describe("OfferComponent", () => {
  let component: OfferComponent;
  let fixture: ComponentFixture<OfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfferComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OfferComponent);
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

  it("should render a single hero title with the accentuated need", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll("h1");
    expect(headings.length).toBe(1);
    const title = compiled.querySelector('[data-testid="hero-title"]');
    expect(title?.textContent).toContain("Un périmètre défini sur");
    expect(title?.querySelector(".accent")?.textContent).toContain("votre");
  });

  it("should compose the Asili sections (hero, méthode, bande CTA)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("app-asili-hero")).not.toBeNull();
    expect(compiled.querySelector("app-asili-method")).not.toBeNull();
    expect(compiled.querySelector("app-asili-cta-band")).not.toBeNull();
  });

  it("should render the four intervention modes", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const modes = compiled.querySelectorAll(
      '[data-testid="modes-section"] .mode',
    );
    expect(modes.length).toBe(4);
  });

  it("should render the three differentiators", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const diffs = compiled.querySelectorAll(
      '[data-testid="diff-section"] .diff',
    );
    expect(diffs.length).toBe(component["diffs"].length);
  });

  it("should render an SSR-safe FAQ with FAQPage microdata and the pricing question", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const faq = compiled.querySelector(
      '.faq[itemtype="https://schema.org/FAQPage"]',
    );
    expect(faq).not.toBeNull();
    const questions = compiled.querySelectorAll(".faq details.faq-item");
    expect(questions.length).toBe(component["faqItems"].length);
    expect(faq?.textContent).toContain("Pourquoi pas de grille de prix ?");
  });
});
