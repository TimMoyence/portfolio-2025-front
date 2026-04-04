import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { WEATHER_PORT } from "../../../../core/ports/weather.port";
import {
  createWeatherPortStub,
  buildForecastResponse,
} from "../../../../../testing/factories/weather.factory";
import { WeatherLevelService } from "../../services/weather-level.service";
import { UnitPreferencesService } from "../../services/unit-preferences.service";
import { HourlyChartComponent } from "./hourly-chart.component";

describe("HourlyChartComponent", () => {
  let component: HourlyChartComponent;
  let fixture: ComponentFixture<HourlyChartComponent>;
  let unitService: UnitPreferencesService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HourlyChartComponent],
      providers: [
        { provide: WEATHER_PORT, useValue: createWeatherPortStub() },
        WeatherLevelService,
        UnitPreferencesService,
      ],
    }).compileComponents();

    unitService = TestBed.inject(UnitPreferencesService);
    fixture = TestBed.createComponent(HourlyChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait avoir des donnees horaires nulles par defaut", () => {
    expect(component.hourly()).toBeNull();
  });

  it("devrait utiliser le label Fahrenheit quand l'unite change", () => {
    // Preparer des donnees horaires suffisantes (24h)
    const forecast = buildForecastResponse();
    const hourlyData = {
      ...forecast.hourly,
      time: Array.from(
        { length: 24 },
        (_, i) => `2026-03-31T${String(i).padStart(2, "0")}:00`,
      ),
      temperature_2m: Array.from({ length: 24 }, (_, i) => 15 + i * 0.5),
      precipitation: Array.from({ length: 24 }, () => 0),
      weather_code: Array.from({ length: 24 }, () => 0),
      wind_speed_10m: Array.from({ length: 24 }, () => 10),
    };

    // Configurer en Fahrenheit AVANT de fournir les donnees
    unitService.temperatureUnit.set("fahrenheit");
    fixture.componentRef.setInput("hourly", hourlyData);
    fixture.detectChanges();

    // Le chart doit etre construit avec le label Fahrenheit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chart = (component as any).chart;
    expect(chart).toBeTruthy();
    // Verifier que le label du dataset contient °F
    expect(chart.data.datasets[0].label).toContain("°F");
  });
});
