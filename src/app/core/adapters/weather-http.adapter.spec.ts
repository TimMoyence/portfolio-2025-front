import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environnement";
import { APP_CONFIG } from "../config/app-config.token";
import type { GeocodingResponse } from "../models/weather.model";
import {
  buildAirQualityData,
  buildEnsembleData,
  buildForecastResponse,
  buildHistoricalData,
  buildWeatherPreferences,
} from "../../../testing/factories/weather.factory";
import { WeatherHttpAdapter } from "./weather-http.adapter";

describe("WeatherHttpAdapter", () => {
  let adapter: WeatherHttpAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        WeatherHttpAdapter,
        {
          provide: APP_CONFIG,
          useValue: environment,
        },
      ],
    });

    adapter = TestBed.inject(WeatherHttpAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("devrait envoyer un GET a l'endpoint geocoding avec les parametres", () => {
    const response: GeocodingResponse = {
      results: [
        {
          id: 1,
          name: "Paris",
          latitude: 48.85,
          longitude: 2.35,
          country: "France",
          country_code: "FR",
          admin1: "Île-de-France",
        },
      ],
    };

    adapter.searchCity("Paris").subscribe((result) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiBaseUrl}/weather/geocoding` &&
        r.params.get("name") === "Paris" &&
        r.params.get("language") === "fr" &&
        r.params.get("count") === "5",
    );
    expect(req.request.method).toBe("GET");
    req.flush(response);
  });

  it("devrait envoyer un GET a l'endpoint forecast avec les coordonnees", () => {
    const response = buildForecastResponse();

    adapter.getForecast(48.85, 2.35).subscribe((result) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiBaseUrl}/weather/forecast` &&
        r.params.get("latitude") === "48.85" &&
        r.params.get("longitude") === "2.35" &&
        r.params.get("timezone") === "auto",
    );
    expect(req.request.method).toBe("GET");
    req.flush(response);
  });

  it("devrait propager les erreurs HTTP", () => {
    adapter.searchCity("test").subscribe({
      next: () => fail("devrait echouer"),
      error: (error) => {
        expect(error.status).toBe(500);
      },
    });

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiBaseUrl}/weather/geocoding`,
    );
    req.flush("Erreur serveur", {
      status: 500,
      statusText: "Internal Server Error",
    });
  });

  it("devrait envoyer un GET a l'endpoint preferences", () => {
    const response = buildWeatherPreferences({ level: "curious" });

    adapter.getPreferences().subscribe((result) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/weather/preferences`,
    );
    expect(req.request.method).toBe("GET");
    req.flush(response);
  });

  it("devrait envoyer un PATCH a l'endpoint preferences", () => {
    const response = buildWeatherPreferences({ level: "expert" });

    adapter.updatePreferences({ level: "expert" }).subscribe((result) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/weather/preferences`,
    );
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ level: "expert" });
    req.flush(response);
  });

  it("devrait envoyer un POST a l'endpoint record-usage", () => {
    adapter.recordUsage().subscribe();

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/weather/preferences/record-usage`,
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({});
    req.flush(null);
  });

  it("devrait envoyer un GET a l'endpoint air-quality avec les coordonnees", () => {
    const response = buildAirQualityData();

    adapter.getAirQuality(48.85, 2.35).subscribe((result: unknown) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiBaseUrl}/weather/air-quality` &&
        r.params.get("latitude") === "48.85" &&
        r.params.get("longitude") === "2.35",
    );
    expect(req.request.method).toBe("GET");
    req.flush(response);
  });

  it("devrait envoyer un GET a l'endpoint ensemble avec les coordonnees", () => {
    const response = buildEnsembleData();

    adapter.getEnsemble(48.85, 2.35).subscribe((result: unknown) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiBaseUrl}/weather/ensemble` &&
        r.params.get("latitude") === "48.85" &&
        r.params.get("longitude") === "2.35",
    );
    expect(req.request.method).toBe("GET");
    req.flush(response);
  });

  it("devrait envoyer un GET a l'endpoint historical avec les parametres", () => {
    const response = buildHistoricalData();

    adapter
      .getHistorical(48.85, 2.35, "2026-03-01", "2026-03-30")
      .subscribe((result: unknown) => {
        expect(result).toEqual(response);
      });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiBaseUrl}/weather/historical` &&
        r.params.get("latitude") === "48.85" &&
        r.params.get("longitude") === "2.35" &&
        r.params.get("startDate") === "2026-03-01" &&
        r.params.get("endDate") === "2026-03-30",
    );
    expect(req.request.method).toBe("GET");
    req.flush(response);
  });
});
