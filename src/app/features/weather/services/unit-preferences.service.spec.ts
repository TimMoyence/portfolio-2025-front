import { LOCALE_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { WEATHER_PORT } from "../../../core/ports/weather.port";
import {
  buildWeatherPreferences,
  createWeatherPortStub,
} from "../../../../testing/factories/weather.factory";
import { UnitPreferencesService } from "./unit-preferences.service";

/**
 * Cree un UnitPreferencesService via TestBed pour la locale donnee.
 * Retourne le service et le stub du port meteo.
 */
function setup(locale: string) {
  const weatherPortStub = createWeatherPortStub();
  weatherPortStub.updatePreferences.and.returnValue(
    of(buildWeatherPreferences()),
  );

  TestBed.configureTestingModule({
    providers: [
      UnitPreferencesService,
      { provide: WEATHER_PORT, useValue: weatherPortStub },
      { provide: LOCALE_ID, useValue: locale },
    ],
  });

  return { service: TestBed.inject(UnitPreferencesService), weatherPortStub };
}

describe("UnitPreferencesService", () => {
  afterEach(() => TestBed.resetTestingModule());

  describe("locale fr (metrique)", () => {
    let service: UnitPreferencesService;

    beforeEach(() => {
      ({ service } = setup("fr"));
    });

    it("devrait se creer", () => {
      expect(service).toBeTruthy();
    });

    it("devrait initialiser avec les unites metriques par defaut", () => {
      expect(service.temperatureUnit()).toBe("celsius");
      expect(service.speedUnit()).toBe("kmh");
      expect(service.pressureUnit()).toBe("hpa");
    });
  });

  describe("locale en-CA (metrique — Canada anglophone)", () => {
    let service: UnitPreferencesService;

    beforeEach(() => {
      ({ service } = setup("en-CA"));
    });

    it("devrait initialiser avec les unites metriques par defaut", () => {
      expect(service.temperatureUnit()).toBe("celsius");
      expect(service.speedUnit()).toBe("kmh");
      expect(service.pressureUnit()).toBe("hpa");
    });
  });

  describe("locale en (imperial — anglais generique)", () => {
    let service: UnitPreferencesService;

    beforeEach(() => {
      ({ service } = setup("en"));
    });

    it("devrait initialiser avec les unites imperiales par defaut", () => {
      expect(service.temperatureUnit()).toBe("fahrenheit");
      expect(service.speedUnit()).toBe("mph");
      expect(service.pressureUnit()).toBe("inhg");
    });
  });

  describe("locale en-US (imperial)", () => {
    let service: UnitPreferencesService;

    beforeEach(() => {
      ({ service } = setup("en-US"));
    });

    it("devrait initialiser avec les unites imperiales par defaut", () => {
      expect(service.temperatureUnit()).toBe("fahrenheit");
      expect(service.speedUnit()).toBe("mph");
      expect(service.pressureUnit()).toBe("inhg");
    });
  });

  describe("loadFromPreferences ecrase les defauts", () => {
    let service: UnitPreferencesService;

    beforeEach(() => {
      ({ service } = setup("en"));
    });

    it("devrait charger les unites depuis les preferences", () => {
      const prefs = buildWeatherPreferences({
        units: {
          temperature: "celsius",
          speed: "kmh",
          pressure: "hpa",
        },
      });

      service.loadFromPreferences(prefs);

      expect(service.temperatureUnit()).toBe("celsius");
      expect(service.speedUnit()).toBe("kmh");
      expect(service.pressureUnit()).toBe("hpa");
    });

    it("devrait garder les valeurs par defaut si pas d'unites dans les preferences", () => {
      const prefs = buildWeatherPreferences();

      service.loadFromPreferences(prefs);

      expect(service.temperatureUnit()).toBe("fahrenheit");
      expect(service.speedUnit()).toBe("mph");
      expect(service.pressureUnit()).toBe("inhg");
    });
  });

  describe("synchronisation avec le backend (locale fr)", () => {
    let service: UnitPreferencesService;
    let weatherPortStub: ReturnType<typeof createWeatherPortStub>;

    beforeEach(() => {
      ({ service, weatherPortStub } = setup("fr"));
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
});
