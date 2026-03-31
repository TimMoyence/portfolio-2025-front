import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import type { DailyForecast } from "../../../../core/models/weather.model";
import { DailyForecastComponent } from "./daily-forecast.component";

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
    const daily: DailyForecast = {
      time: [
        "2026-03-31",
        "2026-04-01",
        "2026-04-02",
        "2026-04-03",
        "2026-04-04",
        "2026-04-05",
        "2026-04-06",
      ],
      weather_code: [0, 1, 2, 3, 61, 80, 95],
      temperature_2m_max: [20, 18, 16, 14, 12, 15, 17],
      temperature_2m_min: [10, 8, 7, 6, 5, 7, 9],
      sunrise: [
        "2026-03-31T06:30",
        "2026-04-01T06:28",
        "2026-04-02T06:26",
        "2026-04-03T06:24",
        "2026-04-04T06:22",
        "2026-04-05T06:20",
        "2026-04-06T06:18",
      ],
      sunset: [
        "2026-03-31T19:30",
        "2026-04-01T19:32",
        "2026-04-02T19:34",
        "2026-04-03T19:36",
        "2026-04-04T19:38",
        "2026-04-05T19:40",
        "2026-04-06T19:42",
      ],
      precipitation_sum: [0, 0, 0, 0, 5.2, 10.1, 0.3],
    };

    fixture.componentRef.setInput("daily", daily);
    fixture.detectChanges();

    const days = component.days();
    expect(days.length).toBe(7);
    expect(days[0].icon).toContain("soleil.png");
    expect(days[0].tempMax).toBe(20);
    expect(days[0].tempMin).toBe(10);
  });

  it("devrait calculer la largeur de la barre de temperature", () => {
    const daily: DailyForecast = {
      time: ["2026-03-31", "2026-04-01"],
      weather_code: [0, 3],
      temperature_2m_max: [20, 10],
      temperature_2m_min: [10, 5],
      sunrise: ["2026-03-31T06:30", "2026-04-01T06:28"],
      sunset: ["2026-03-31T19:30", "2026-04-01T19:32"],
      precipitation_sum: [0, 0],
    };

    fixture.componentRef.setInput("daily", daily);
    fixture.detectChanges();

    const days = component.days();
    const width = component.tempBarWidth(days[0]);
    expect(width).toBe(100);
  });
});
