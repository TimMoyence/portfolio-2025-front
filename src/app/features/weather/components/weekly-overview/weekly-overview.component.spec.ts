import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WeeklyOverviewComponent } from "./weekly-overview.component";
import { UnitPreferencesService } from "../../services/unit-preferences.service";
import { WEATHER_PORT } from "../../../../core/ports/weather.port";
import { createWeatherPortStub } from "../../../../../testing/factories/weather.factory";
import type {
  DailyForecast,
  HourlyForecast,
} from "../../../../core/models/weather.model";

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

/** Construit un DailyForecast minimal pour les tests. */
function buildTestDaily(): DailyForecast {
  return {
    time: ["2026-04-01"],
    weather_code: [0],
    temperature_2m_max: [25],
    temperature_2m_min: [10],
    sunrise: ["2026-04-01T06:30"],
    sunset: ["2026-04-01T19:30"],
    precipitation_sum: [5],
    wind_speed_10m_max: [20],
    wind_gusts_10m_max: [35],
    wind_direction_10m_dominant: [180],
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

  it("devrait calculer les dayRows quand daily est fourni", () => {
    fixture.componentRef.setInput("daily", buildTestDaily());
    fixture.componentRef.setInput("hourly", buildTestHourly());
    fixture.detectChanges();

    const rows = component.dayRows();
    expect(rows.length).toBe(1);
    expect(rows[0].tempMax).toBe(25);
    expect(rows[0].tempMin).toBe(10);
  });

  it("devrait calculer les slots en mode 3h", () => {
    fixture.componentRef.setInput("hourly", buildTestHourly());
    fixture.detectChanges();

    component.setGranularity("3h");
    fixture.detectChanges();

    expect(component.slots().length).toBe(8);
  });

  it("devrait grouper les slots par jour", () => {
    fixture.componentRef.setInput("hourly", buildTestHourly());
    fixture.detectChanges();

    component.setGranularity("3h");
    fixture.detectChanges();

    const groups = component.slotGroups();
    expect(groups.length).toBe(1);
    expect(groups[0].slots.length).toBe(8);
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

  it("devrait afficher les 3 tabs de granularite", () => {
    fixture.componentRef.setInput("daily", buildTestDaily());
    fixture.componentRef.setInput("hourly", buildTestHourly());
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(3);
  });

  it("devrait retourner une couleur valide pour tempColor", () => {
    const color = component.tempColor(20, 0.3);
    expect(color).toMatch(/^rgba\(\d+, \d+, \d+, 0\.3\)$/);
  });

  it("devrait detecter isCurious pour curious et expert", () => {
    fixture.componentRef.setInput("level", "discovery");
    fixture.detectChanges();
    expect(component.isCurious()).toBeFalse();

    fixture.componentRef.setInput("level", "curious");
    fixture.detectChanges();
    expect(component.isCurious()).toBeTrue();

    fixture.componentRef.setInput("level", "expert");
    fixture.detectChanges();
    expect(component.isCurious()).toBeTrue();
  });
});
