import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { SebastianPresentationComponent } from "./sebastian-presentation.component";

describe("SebastianPresentationComponent", () => {
  let fixture: ComponentFixture<SebastianPresentationComponent>;
  let component: SebastianPresentationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SebastianPresentationComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SebastianPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should expose 10 badges", () => {
    expect(component.badges.length).toBe(10);
  });

  it("should expose health score of 78", () => {
    expect(component.healthScore.score).toBe(78);
  });

  it("should start gauge at 0", () => {
    expect(component.gaugeValue()).toBe(0);
  });

  it("should compute full gaugeOffset at 0%", () => {
    expect(component.gaugeOffset()).toBe(283);
  });

  it("should render marketing headline", () => {
    expect(fixture.nativeElement.textContent).toContain("Gardez le contr");
  });

  it("should render login CTA", () => {
    expect(
      fixture.nativeElement.querySelector('a[href="/login"]'),
    ).toBeTruthy();
  });

  it("should expose BAC data with currentBac 0.12", () => {
    expect(component.bac.currentBac).toBe(0.12);
  });

  it("should expose daily counts coffee 2/4", () => {
    expect(component.dailyCounts.coffee.current).toBe(2);
    expect(component.dailyCounts.coffee.goal).toBe(4);
  });

  it("should expose daily counts alcohol 1/3", () => {
    expect(component.dailyCounts.alcohol.current).toBe(1);
    expect(component.dailyCounts.alcohol.goal).toBe(3);
  });

  it("should expose 28 heatmap points", () => {
    expect(component.heatmap.length).toBe(28);
  });

  it("should expose 7 trend data points", () => {
    expect(component.trends.dataPoints.length).toBe(7);
  });

  it("should have all badges unlocked=false", () => {
    const allLocked = component.badges.every((b) => !b.unlocked);
    expect(allLocked).toBeTrue();
  });

  it("should render discover CTA link", () => {
    expect(fixture.nativeElement.querySelector('a[href="#how"]')).toBeTruthy();
  });

  it("should compute coffee percent as 50%", () => {
    expect(component.coffeePercent()).toBe("50%");
  });

  it("should compute alcohol percent as 33%", () => {
    expect(component.alcoholPercent()).toBe("33%");
  });
});
