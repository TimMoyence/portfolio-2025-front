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

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render main title", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('[data-testid="hero-title"]');
    expect(heading?.textContent).toContain(
      "Nos offres de developpement web et d'accompagnement digital",
    );
  });

  it("should render services, qualities, and contact CTA sections", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector('[data-testid="services-section"]'),
    ).not.toBeNull();
    expect(
      compiled.querySelector('[data-testid="qualities-section"]'),
    ).not.toBeNull();
    expect(compiled.querySelector("app-cta-contact")).not.toBeNull();
  });
});
