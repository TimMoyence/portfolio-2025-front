import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { BudgetPresentationComponent } from "./budget-presentation.component";

describe("BudgetPresentationComponent", () => {
  let fixture: ComponentFixture<BudgetPresentationComponent>;
  let component: BudgetPresentationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetPresentationComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should expose 8 categories", () => {
    expect(component.categories.length).toBe(8);
  });

  it("should expose summary with total expenses", () => {
    expect(component.summary.totalExpenses).toBe("2 847 \u20AC");
  });

  it("should expose Tim at 54%", () => {
    expect(component.contributions.tim.percentage).toBe(54);
  });

  it("should have 6 months with Avr active", () => {
    expect(component.months.length).toBe(6);
    expect(component.activeMonth).toBe("Avr");
  });

  it("should render marketing headline", () => {
    expect(fixture.nativeElement.textContent).toContain("Fini les prises de t");
  });

  it("should render login CTA", () => {
    expect(
      fixture.nativeElement.querySelector('a[href="/login"]'),
    ).toBeTruthy();
  });

  it("should expose Maria at 46%", () => {
    expect(component.contributions.maria.percentage).toBe(46);
  });

  it("should expose combined salary of 5200", () => {
    expect(component.contributions.combined).toBe(5200);
  });

  it("should expose 8 donut segments", () => {
    expect(component.donutSegments.length).toBe(8);
  });

  it("should have conic gradient string", () => {
    expect(component.conicGradient).toContain("conic-gradient");
  });

  it("should expose 4 features", () => {
    expect(component.features.length).toBe(4);
  });

  it("should expose 4 timeline steps", () => {
    expect(component.timeline.length).toBe(4);
  });

  it("should expose 8 category totals", () => {
    expect(component.categoryTotals.length).toBe(8);
  });

  it("should initialize parallaxOffset to 0", () => {
    expect(component.parallaxOffset).toBe(0);
  });

  it("should render discover CTA link", () => {
    expect(
      fixture.nativeElement.querySelector('a[href="#features"]'),
    ).toBeTruthy();
  });
});
