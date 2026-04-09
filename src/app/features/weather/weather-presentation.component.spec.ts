import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { WEATHER_PORT } from "../../core/ports/weather.port";
import { createWeatherPortStub } from "../../../testing/factories/weather.factory";
import { UnitPreferencesService } from "./services/unit-preferences.service";
import { WeatherLevelService } from "./services/weather-level.service";
import { WeatherPresentationComponent } from "./weather-presentation.component";

describe("WeatherPresentationComponent", () => {
  let fixture: ComponentFixture<WeatherPresentationComponent>;
  let component: WeatherPresentationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherPresentationComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: WEATHER_PORT, useFactory: createWeatherPortStub },
        UnitPreferencesService,
        WeatherLevelService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should expose mock current weather data", () => {
    expect(component.current.temperature_2m).toBe(18);
    expect(component.current.wind_speed_10m).toBe(12);
  });

  it("should compute 7 weekDays from daily forecast", () => {
    expect(component.weekDays.length).toBe(7);
    expect(component.weekDays[0].tempMax).toBe(18);
  });

  it("should render hero with temperature", () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain("18");
  });

  it("should render CTA with login link", () => {
    const cta = fixture.nativeElement.querySelector('a[href="/login"]');
    expect(cta).toBeTruthy();
  });

  it("should render marketing headline", () => {
    expect(fixture.nativeElement.textContent).toContain(
      "Ne sortez plus sans savoir",
    );
  });

  it("should expose air quality data with AQI 42", () => {
    expect(component.airQuality.current.european_aqi).toBe(42);
  });

  it("should mark first weekDay as today", () => {
    expect(component.weekDays[0].isToday).toBeTrue();
    expect(component.weekDays[0].label).toBe("Auj.");
  });

  it("should initialize parallaxOffset to 0", () => {
    expect(component.parallaxOffset).toBe(0);
  });
});
