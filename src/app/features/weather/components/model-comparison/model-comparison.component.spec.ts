import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { buildEnsembleData } from "../../../../../testing/factories/weather.factory";
import { ModelComparisonComponent } from "./model-comparison.component";

describe("ModelComparisonComponent", () => {
  let component: ModelComparisonComponent;
  let fixture: ComponentFixture<ModelComparisonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelComparisonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait avoir des donnees ensemble nulles par defaut", () => {
    expect(component.ensemble()).toBeNull();
  });

  it("devrait calculer les colonnes a partir des donnees ensemble", () => {
    fixture.componentRef.setInput("ensemble", buildEnsembleData());
    fixture.detectChanges();

    const cols = component.columns();
    expect(cols.length).toBe(3);
    expect(cols[0].model).toBe("ECMWF");
    expect(cols[1].model).toBe("GFS");
    expect(cols[2].model).toBe("ICON");
  });

  it("devrait calculer la temperature moyenne sur 24h", () => {
    fixture.componentRef.setInput("ensemble", buildEnsembleData());
    fixture.detectChanges();

    const ecmwf = component.columns()[0];
    // (18 + 19) / 2 = 18.5
    expect(ecmwf.avgTemp).toBe(18.5);
  });

  it("devrait calculer les precipitations totales sur 24h", () => {
    fixture.componentRef.setInput("ensemble", buildEnsembleData());
    fixture.detectChanges();

    const gfs = component.columns()[1];
    // 0.1 + 0.3 = 0.4
    expect(gfs.totalPrecip).toBeCloseTo(0.4, 1);
  });

  it("devrait ne pas signaler de divergence pour des ecarts <= 3 degres", () => {
    fixture.componentRef.setInput("ensemble", buildEnsembleData());
    fixture.detectChanges();

    expect(component.tempDivergent()).toBeFalse();
  });

  it("devrait signaler une divergence pour des ecarts > 3 degres", () => {
    const data = buildEnsembleData();
    // Forcer un ecart > 3°C entre ECMWF et ICON
    data.models[0].hourly.temperature_2m = [10, 10];
    data.models[2].hourly.temperature_2m = [25, 25];

    fixture.componentRef.setInput("ensemble", data);
    fixture.detectChanges();

    expect(component.tempDivergent()).toBeTrue();
  });
});
