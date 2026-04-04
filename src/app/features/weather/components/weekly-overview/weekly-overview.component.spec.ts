import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WeeklyOverviewComponent } from "./weekly-overview.component";
import { UnitPreferencesService } from "../../services/unit-preferences.service";
import { WEATHER_PORT } from "../../../../core/ports/weather.port";
import { createWeatherPortStub } from "../../../../../testing/factories/weather.factory";
import type { HourlyForecast } from "../../../../core/models/weather.model";

/** Construit un jeu horaire minimal de 24h pour les tests. */
function buildTestHourly(): HourlyForecast {
  const times: string[] = [];
  const temps: number[] = [];
  const codes: number[] = [];
  const winds: number[] = [];
  const precips: number[] = [];

  for (let h = 0; h < 24; h++) {
    times.push(`2026-04-01T${h.toString().padStart(2, "0")}:00`);
    temps.push(10 + h);
    codes.push(h < 12 ? 0 : 61);
    winds.push(5 + h);
    precips.push(h >= 12 ? 1 : 0);
  }

  return {
    time: times,
    temperature_2m: temps,
    weather_code: codes,
    wind_speed_10m: winds,
    precipitation: precips,
  };
}

describe("WeeklyOverviewComponent", () => {
  let component: WeeklyOverviewComponent;
  let fixture: ComponentFixture<WeeklyOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklyOverviewComponent],
      providers: [
        UnitPreferencesService,
        { provide: WEATHER_PORT, useValue: createWeatherPortStub() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WeeklyOverviewComponent);
    component = fixture.componentInstance;
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait avoir la granularite par defaut a 'day'", () => {
    expect(component.granularity()).toBe("day");
  });

  it("devrait calculer les slots quand hourly est fourni", () => {
    fixture.componentRef.setInput("hourly", buildTestHourly());
    fixture.detectChanges();

    const slots = component.slots();
    expect(slots.length).toBe(1); // 1 jour
    expect(slots[0].avgTemp).toBeCloseTo(21.5, 1);
  });

  it("devrait recalculer les slots quand la granularite change", () => {
    fixture.componentRef.setInput("hourly", buildTestHourly());
    fixture.detectChanges();

    component.setGranularity("3h");
    fixture.detectChanges();

    expect(component.slots().length).toBe(8); // 24h / 3h = 8 blocs
  });

  it("devrait emettre granularityChange quand on change de granularite", () => {
    const spy = spyOn(component.granularityChange, "emit");

    component.setGranularity("1h");

    expect(spy).toHaveBeenCalledWith("1h");
  });

  it("ne devrait pas emettre si la granularite est identique", () => {
    const spy = spyOn(component.granularityChange, "emit");

    component.setGranularity("day");

    expect(spy).not.toHaveBeenCalled();
  });

  it("devrait retourner un tableau vide si hourly est null", () => {
    fixture.componentRef.setInput("hourly", null);
    fixture.detectChanges();

    expect(component.slots()).toEqual([]);
  });

  it("devrait afficher les labels de granularite dans le template", () => {
    fixture.componentRef.setInput("hourly", buildTestHourly());
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(3);
  });
});
