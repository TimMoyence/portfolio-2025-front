import { PLATFORM_ID } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { WEATHER_PORT } from "../../../../core/ports/weather.port";
import {
  buildDailyForecast,
  createWeatherPortStub,
  buildWeatherPreferences,
} from "../../../../../testing/factories/weather.factory";
import { DailyForecastComponent } from "./daily-forecast.component";

describe("DailyForecastComponent", () => {
  let component: DailyForecastComponent;
  let fixture: ComponentFixture<DailyForecastComponent>;

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
      imports: [DailyForecastComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: "browser" },
        { provide: WEATHER_PORT, useValue: weatherPortStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyForecastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait retourner un tableau vide si aucune donnee", () => {
    expect(component.days()).toEqual([]);
  });

  it("devrait afficher 7 jours par defaut", () => {
    const daily = buildDailyForecast();

    fixture.componentRef.setInput("daily", daily);
    fixture.detectChanges();

    const days = component.days();
    expect(days.length).toBe(7);
    expect(days[0].icon).toContain("soleil.png");
    expect(days[0].tempMax).toBe(20);
    expect(days[0].tempMin).toBe(10);
  });

  it("devrait emettre forecastDaysChange lors du toggle vers 14j", () => {
    spyOn(component.forecastDaysChange, "emit");

    component.setForecastDays(14);

    expect(component.forecastDays()).toBe(14);
    expect(component.forecastDaysChange.emit).toHaveBeenCalledWith(14);
  });

  it("ne devrait pas emettre si le meme nombre de jours est selectionne", () => {
    spyOn(component.forecastDaysChange, "emit");

    component.setForecastDays(7); // Deja a 7

    expect(component.forecastDaysChange.emit).not.toHaveBeenCalled();
  });

  it("devrait emettre daySelected au clic sur un jour", () => {
    spyOn(component.daySelected, "emit");

    component.onDayClick(3);

    expect(component.daySelected.emit).toHaveBeenCalledWith(3);
  });

  it("devrait calculer la largeur de la barre de temperature", () => {
    const daily = buildDailyForecast({
      time: ["2026-03-31", "2026-04-01"],
      weather_code: [0, 3],
      temperature_2m_max: [20, 10],
      temperature_2m_min: [10, 5],
      sunrise: ["2026-03-31T06:30", "2026-04-01T06:28"],
      sunset: ["2026-03-31T19:30", "2026-04-01T19:32"],
      precipitation_sum: [0, 0],
    });

    fixture.componentRef.setInput("daily", daily);
    fixture.detectChanges();

    const days = component.days();
    const width = component.tempBarWidth(days[0]);
    expect(width).toBe(100);
  });

  it("devrait limiter les jours au nombre disponible dans les donnees", () => {
    const daily = buildDailyForecast(); // 7 jours

    fixture.componentRef.setInput("daily", daily);
    component.setForecastDays(14);
    fixture.detectChanges();

    // Seulement 7 jours de donnees, meme si on demande 14
    expect(component.days().length).toBe(7);
  });

  it("devrait inclure un index dans chaque jour", () => {
    fixture.componentRef.setInput("daily", buildDailyForecast());
    fixture.detectChanges();

    const days = component.days();
    expect(days[0].index).toBe(0);
    expect(days[6].index).toBe(6);
  });
});
