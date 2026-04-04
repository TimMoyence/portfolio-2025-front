import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { WEATHER_PORT } from "../../../core/ports/weather.port";
import {
  buildWeatherPreferences,
  createWeatherPortStub,
} from "../../../../testing/factories/weather.factory";
import { UnitPreferencesService } from "./unit-preferences.service";

describe("UnitPreferencesService", () => {
  let service: UnitPreferencesService;
  let weatherPortStub: ReturnType<typeof createWeatherPortStub>;

  beforeEach(() => {
    weatherPortStub = createWeatherPortStub();
    weatherPortStub.updatePreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );

    TestBed.configureTestingModule({
      providers: [
        UnitPreferencesService,
        { provide: WEATHER_PORT, useValue: weatherPortStub },
      ],
    });

    service = TestBed.inject(UnitPreferencesService);
  });

  it("devrait se creer", () => {
    expect(service).toBeTruthy();
  });

  it("devrait initialiser avec les unites par defaut celsius/kmh/hpa", () => {
    expect(service.temperatureUnit()).toBe("celsius");
    expect(service.speedUnit()).toBe("kmh");
    expect(service.pressureUnit()).toBe("hpa");
  });

  it("devrait charger les unites depuis les preferences", () => {
    const prefs = buildWeatherPreferences({
      units: {
        temperature: "fahrenheit",
        speed: "mph",
        pressure: "inhg",
      },
    });

    service.loadFromPreferences(prefs);

    expect(service.temperatureUnit()).toBe("fahrenheit");
    expect(service.speedUnit()).toBe("mph");
    expect(service.pressureUnit()).toBe("inhg");
  });

  it("devrait garder les valeurs par defaut si pas d'unites dans les preferences", () => {
    const prefs = buildWeatherPreferences();

    service.loadFromPreferences(prefs);

    expect(service.temperatureUnit()).toBe("celsius");
    expect(service.speedUnit()).toBe("kmh");
    expect(service.pressureUnit()).toBe("hpa");
  });

  it("devrait mettre a jour l'unite de temperature et synchroniser avec le backend", () => {
    service.setTemperatureUnit("fahrenheit");

    expect(service.temperatureUnit()).toBe("fahrenheit");
    expect(weatherPortStub.updatePreferences).toHaveBeenCalledWith({
      units: {
        temperature: "fahrenheit",
        speed: "kmh",
        pressure: "hpa",
      },
    });
  });

  it("devrait mettre a jour l'unite de vitesse et synchroniser avec le backend", () => {
    service.setSpeedUnit("mph");

    expect(service.speedUnit()).toBe("mph");
    expect(weatherPortStub.updatePreferences).toHaveBeenCalledWith({
      units: {
        temperature: "celsius",
        speed: "mph",
        pressure: "hpa",
      },
    });
  });

  it("devrait mettre a jour l'unite de pression et synchroniser avec le backend", () => {
    service.setPressureUnit("inhg");

    expect(service.pressureUnit()).toBe("inhg");
    expect(weatherPortStub.updatePreferences).toHaveBeenCalledWith({
      units: {
        temperature: "celsius",
        speed: "kmh",
        pressure: "inhg",
      },
    });
  });
});
