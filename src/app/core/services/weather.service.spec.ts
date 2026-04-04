import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import type {
  DetailedCurrentWeather,
  DetailedForecastResult,
} from "../models/weather.model";
import { WEATHER_PORT } from "../ports/weather.port";
import {
  buildAirQualityData,
  buildEnsembleData,
  buildForecastResponse,
  buildHistoricalData,
  buildWeatherPreferences,
  createWeatherPortStub,
} from "../../../testing/factories/weather.factory";
import { WeatherService } from "./weather.service";

/**
 * WeatherService est une facade intentionnellement "thin" :
 * elle delegue chaque appel au port meteo injecte.
 *
 * Seule exception notable : getForecast() passe explicitement `undefined`
 * comme timezone au port — ce mapping de parametres est verifie.
 *
 * Les tests verifient le COMPORTEMENT observable (valeurs propagees,
 * erreurs, mapping de parametres) plutot que l'implementation interne.
 */
describe("WeatherService", () => {
  let service: WeatherService;
  let weatherPortStub: ReturnType<typeof createWeatherPortStub>;

  beforeEach(() => {
    weatherPortStub = createWeatherPortStub();

    TestBed.configureTestingModule({
      providers: [
        WeatherService,
        { provide: WEATHER_PORT, useValue: weatherPortStub },
      ],
    });

    service = TestBed.inject(WeatherService);
  });

  it("devrait etre instancie avec le port meteo injecte", () => {
    expect(service).toBeTruthy();
  });

  // --- searchCity : propage les resultats de recherche ---

  it("devrait propager les resultats de recherche de villes", (done: DoneFn) => {
    const response = {
      results: [
        {
          id: 1,
          name: "Paris",
          latitude: 48.85,
          longitude: 2.35,
          country: "France",
          country_code: "FR",
        },
      ],
    };
    weatherPortStub.searchCity.and.returnValue(of(response));

    service.searchCity("Paris").subscribe({
      next: (result) => {
        expect(result.results).toHaveSize(1);
        expect(result.results[0].name).toBe("Paris");
        done();
      },
    });
  });

  // --- getForecast : verifie le mapping de parametres (timezone = undefined) ---

  it("devrait passer undefined comme timezone au port pour getForecast()", (done: DoneFn) => {
    const response = buildForecastResponse();
    weatherPortStub.getForecast.and.returnValue(of(response));

    service.getForecast(48.85, 2.35).subscribe({
      next: (result) => {
        expect(result.current.temperature_2m).toBe(18);
        done();
      },
    });

    // Verifie le mapping : timezone est explicitement undefined
    expect(weatherPortStub.getForecast).toHaveBeenCalledWith(
      48.85,
      2.35,
      undefined,
      undefined,
    );
  });

  it("devrait transmettre forecastDays au port pour getForecast()", (done: DoneFn) => {
    const response = buildForecastResponse();
    weatherPortStub.getForecast.and.returnValue(of(response));

    service.getForecast(48.85, 2.35, 3).subscribe({
      next: () => done(),
    });

    // Verifie que forecastDays est bien passe en 4e argument
    expect(weatherPortStub.getForecast).toHaveBeenCalledWith(
      48.85,
      2.35,
      undefined,
      3,
    );
  });

  // --- getPreferences : propage les preferences ---

  it("devrait propager les preferences meteo de l'utilisateur", (done: DoneFn) => {
    const prefs = buildWeatherPreferences({ level: "curious" });
    weatherPortStub.getPreferences.and.returnValue(of(prefs));

    service.getPreferences().subscribe({
      next: (result) => {
        expect(result.level).toBe("curious");
        done();
      },
    });
  });

  // --- updatePreferences : propage les preferences mises a jour ---

  it("devrait propager les preferences mises a jour", (done: DoneFn) => {
    const prefs = buildWeatherPreferences({ level: "expert" });
    weatherPortStub.updatePreferences.and.returnValue(of(prefs));

    service.updatePreferences({ level: "expert" }).subscribe({
      next: (result) => {
        expect(result.level).toBe("expert");
        done();
      },
    });
  });

  // --- recordUsage : complete sans erreur ---

  it("devrait completer sans erreur pour recordUsage()", (done: DoneFn) => {
    weatherPortStub.recordUsage.and.returnValue(of(undefined));

    service.recordUsage().subscribe({
      complete: () => done(),
    });
  });

  // --- getAirQuality : propage les donnees de qualite de l'air ---

  it("devrait propager les donnees de qualite de l'air", (done: DoneFn) => {
    const aqData = buildAirQualityData();
    weatherPortStub.getAirQuality.and.returnValue(of(aqData));

    service.getAirQuality(48.85, 2.35).subscribe({
      next: (result) => {
        expect(result.current.european_aqi).toBe(25);
        done();
      },
    });
  });

  // --- getEnsemble : propage les donnees multi-modeles ---

  it("devrait propager les donnees ensemble multi-modeles", (done: DoneFn) => {
    const response = buildEnsembleData();
    weatherPortStub.getEnsemble.and.returnValue(of(response));

    service.getEnsemble(48.85, 2.35).subscribe({
      next: (result) => {
        expect(result.models).toHaveSize(3);
        expect(result.models[0].model).toBe("ECMWF");
        done();
      },
    });
  });

  // --- getHistorical : propage les donnees historiques ---

  it("devrait propager les donnees historiques", (done: DoneFn) => {
    const response = buildHistoricalData();
    weatherPortStub.getHistorical.and.returnValue(of(response));

    service.getHistorical(48.85, 2.35, "2026-03-01", "2026-03-30").subscribe({
      next: (result) => {
        expect(result.daily.time).toHaveSize(3);
        done();
      },
    });
  });

  // --- getDetailedCurrent : propage les donnees detaillees courantes ---

  it("devrait propager les donnees detaillees courantes", (done: DoneFn) => {
    const mockData: DetailedCurrentWeather = {
      temperature: 18,
      feelsLike: 16,
      minTemp: 12,
      maxTemp: 22,
      humidity: 55,
      seaLevelPressure: 1013,
      groundLevelPressure: 1010,
      windSpeed: 12,
      windGust: 25,
      windDirection: 180,
      cloudCover: 30,
      visibility: 10000,
      rain1h: 0,
      snow1h: 0,
      precipitationProbability: 0,
      conditionId: 800,
      conditionName: "Clear",
      conditionText: "clear sky",
      conditionIcon: "01d",
      sunrise: "2026-03-31T06:30",
      sunset: "2026-03-31T19:30",
      isDaytime: true,
      partOfDay: "d",
      timezoneOffset: 3600,
    };
    weatherPortStub.getDetailedCurrent.and.returnValue(of(mockData));

    service.getDetailedCurrent(48.85, 2.35).subscribe({
      next: (data) => {
        expect(data.temperature).toBe(18);
        expect(data.conditionName).toBe("Clear");
        done();
      },
    });
  });

  // --- getDetailedForecast : propage les previsions detaillees ---

  it("devrait propager les previsions detaillees", (done: DoneFn) => {
    const mockData: DetailedForecastResult = {
      cityName: "Paris",
      country: "FR",
      latitude: 48.85,
      longitude: 2.35,
      timezoneOffset: 3600,
      hourly: [],
      daily: [],
    };
    weatherPortStub.getDetailedForecast.and.returnValue(of(mockData));

    service.getDetailedForecast(48.85, 2.35).subscribe({
      next: (data) => {
        expect(data.cityName).toBe("Paris");
        expect(data.hourly).toEqual([]);
        done();
      },
    });
  });

  // --- Propagation d'erreur ---

  it("devrait propager les erreurs du port a l'appelant", (done: DoneFn) => {
    weatherPortStub.searchCity.and.returnValue(
      throwError(() => new Error("Erreur reseau")),
    );

    service.searchCity("Paris").subscribe({
      error: (err: Error) => {
        expect(err.message).toBe("Erreur reseau");
        done();
      },
    });
  });
});
