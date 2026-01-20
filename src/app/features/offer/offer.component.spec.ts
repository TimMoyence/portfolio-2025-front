import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { OfferComponent } from "./offer.component";

describe("OfferComponent", () => {
  let component: OfferComponent;
  let fixture: ComponentFixture<OfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OfferComponent,
        RouterTestingModule,
        HttpClientTestingModule,
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
    expect(heading?.textContent).toContain("Services professionnels web");
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
