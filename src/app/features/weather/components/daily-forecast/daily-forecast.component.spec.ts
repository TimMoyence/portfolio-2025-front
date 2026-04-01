import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { DailyForecastComponent } from "./daily-forecast.component";
import { buildDailyForecast } from "../../../../../testing/factories/weather.factory";

describe("DailyForecastComponent", () => {
  let component: DailyForecastComponent;
  let fixture: ComponentFixture<DailyForecastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyForecastComponent],
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

  it("devrait formater les jours a partir des donnees journalieres", () => {
    const daily = buildDailyForecast();

    fixture.componentRef.setInput("daily", daily);
    fixture.detectChanges();

    const days = component.days();
    expect(days.length).toBe(7);
    expect(days[0].icon).toContain("soleil.png");
    expect(days[0].tempMax).toBe(20);
    expect(days[0].tempMin).toBe(10);
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
});
