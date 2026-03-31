import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { HistoricalComparisonComponent } from "./historical-comparison.component";

describe("HistoricalComparisonComponent", () => {
  let component: HistoricalComparisonComponent;
  let fixture: ComponentFixture<HistoricalComparisonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricalComparisonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoricalComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait avoir des donnees historiques nulles par defaut", () => {
    expect(component.historical()).toBeNull();
  });

  it("devrait avoir une temperature actuelle de 0 par defaut", () => {
    expect(component.currentTemp()).toBe(0);
  });
});
