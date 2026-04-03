import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { WEATHER_PORT } from "../../../../core/ports/weather.port";
import {
  buildDailyForecast,
  createWeatherPortStub,
  buildWeatherPreferences,
} from "../../../../../testing/factories/weather.factory";
import { DayDetailPanelComponent } from "./day-detail-panel.component";

describe("DayDetailPanelComponent", () => {
  let component: DayDetailPanelComponent;
  let fixture: ComponentFixture<DayDetailPanelComponent>;

  beforeEach(async () => {
    const weatherPortStub = createWeatherPortStub();
    weatherPortStub.getPreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );
    weatherPortStub.updatePreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );
    weatherPortStub.recordUsage.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [DayDetailPanelComponent],
      providers: [{ provide: WEATHER_PORT, useValue: weatherPortStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(DayDetailPanelComponent);
    component = fixture.componentInstance;
  });

  it("devrait se creer", () => {
    fixture.componentRef.setInput("daily", buildDailyForecast());
    fixture.componentRef.setInput("dayIndex", 0);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("devrait afficher le nom du jour et les temperatures", () => {
    const daily = buildDailyForecast();
    fixture.componentRef.setInput("daily", daily);
    fixture.componentRef.setInput("dayIndex", 0);
    fixture.detectChanges();

    const data = component.dayData();
    expect(data).toBeTruthy();
    expect(data!.tempMax).toBe(20);
    expect(data!.tempMin).toBe(10);
  });

  it("devrait afficher l'UV max avec le label de risque", () => {
    const daily = buildDailyForecast({
      uv_index_max: [8, 4, 3, 2, 1, 3, 6],
    });
    fixture.componentRef.setInput("daily", daily);
    fixture.componentRef.setInput("dayIndex", 0);
    fixture.detectChanges();

    const data = component.dayData();
    expect(data!.uvMax).toBe(8);
    expect(component.uvRiskLabel(8)).toContain("lev"); // "Tres eleve" ou "Eleve"
  });

  it("devrait retourner Faible pour un UV <= 2", () => {
    expect(component.uvRiskLabel(1)).toContain("aible");
  });

  it("devrait retourner Modere pour un UV entre 3 et 5", () => {
    expect(component.uvRiskLabel(4)).toContain("od");
  });

  it("devrait retourner Extreme pour un UV > 10", () => {
    expect(component.uvRiskLabel(11)).toContain("xtr");
  });

  it("devrait retourner null si l'index est hors limites", () => {
    fixture.componentRef.setInput("daily", buildDailyForecast());
    fixture.componentRef.setInput("dayIndex", 99);
    fixture.detectChanges();

    expect(component.dayData()).toBeNull();
  });

  it("devrait afficher les donnees de vent", () => {
    const daily = buildDailyForecast();
    fixture.componentRef.setInput("daily", daily);
    fixture.componentRef.setInput("dayIndex", 0);
    fixture.detectChanges();

    const data = component.dayData();
    expect(data!.windMax).toBe(20);
    expect(data!.gustsMax).toBe(35);
  });

  it("devrait afficher les precipitations", () => {
    const daily = buildDailyForecast();
    fixture.componentRef.setInput("daily", daily);
    fixture.componentRef.setInput("dayIndex", 4);
    fixture.detectChanges();

    const data = component.dayData();
    expect(data!.precipitationSum).toBe(5.2);
  });

  it("devrait afficher les symboles fleche pour lever et coucher du soleil", () => {
    fixture.componentRef.setInput("daily", buildDailyForecast());
    fixture.componentRef.setInput("dayIndex", 0);
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain("↑");
    expect(text).toContain("↓");
  });
});
