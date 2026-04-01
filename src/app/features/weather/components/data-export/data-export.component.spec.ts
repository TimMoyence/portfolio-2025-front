import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import {
  buildEnsembleData,
  buildForecastResponse,
} from "../../../../../testing/factories/weather.factory";
import { DataExportComponent } from "./data-export.component";

describe("DataExportComponent", () => {
  let component: DataExportComponent;
  let fixture: ComponentFixture<DataExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataExportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait avoir des previsions nulles par defaut", () => {
    expect(component.forecast()).toBeNull();
  });

  it("devrait avoir des donnees ensemble nulles par defaut", () => {
    expect(component.ensemble()).toBeNull();
  });

  it("devrait exporter le CSV sans erreur avec des donnees", () => {
    fixture.componentRef.setInput("forecast", buildForecastResponse());
    fixture.detectChanges();

    const anchor = jasmine.createSpyObj("a", ["click"]);
    spyOn(document, "createElement").and.returnValue(anchor);
    spyOn(URL, "createObjectURL").and.returnValue("blob:fake");
    spyOn(URL, "revokeObjectURL");

    expect(() => component.exportCsv()).not.toThrow();
    expect(anchor.download).toBe("meteo-export.csv");
    expect(anchor.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake");
  });

  it("devrait exporter le JSON sans erreur avec des donnees", () => {
    fixture.componentRef.setInput("forecast", buildForecastResponse());
    fixture.componentRef.setInput("ensemble", buildEnsembleData());
    fixture.detectChanges();

    const anchor = jasmine.createSpyObj("a", ["click"]);
    spyOn(document, "createElement").and.returnValue(anchor);
    spyOn(URL, "createObjectURL").and.returnValue("blob:fake");
    spyOn(URL, "revokeObjectURL");

    expect(() => component.exportJson()).not.toThrow();
    expect(anchor.download).toBe("meteo-export.json");
    expect(anchor.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake");
  });

  it("devrait ne rien faire lors de l'export CSV sans donnees", () => {
    expect(() => component.exportCsv()).not.toThrow();
  });
});
