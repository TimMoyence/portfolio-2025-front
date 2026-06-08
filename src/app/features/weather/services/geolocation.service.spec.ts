import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { WEATHER_PORT } from "../../../core/ports/weather.port";
import { createWeatherPortStub } from "../../../../testing/factories/weather.factory";
import type { CityResult } from "../../../core/models/weather.model";
import { GeolocationService } from "./geolocation.service";

describe("GeolocationService", () => {
  let weatherPortStub: ReturnType<typeof createWeatherPortStub>;

  function configure(platform: "browser" | "server"): GeolocationService {
    weatherPortStub = createWeatherPortStub();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: platform },
        { provide: WEATHER_PORT, useValue: weatherPortStub },
      ],
    });
    return TestBed.inject(GeolocationService);
  }

  describe("locate", () => {
    it("devrait emettre une erreur cote serveur (SSR)", (done) => {
      const service = configure("server");

      service.locate().subscribe({
        next: () => fail("ne devrait pas emettre cote serveur"),
        error: (err: Error) => {
          expect(err.message).toContain("non disponible");
          done();
        },
      });
    });

    it("devrait retourner un CityResult en cas de succes navigator.geolocation", (done) => {
      const service = configure("browser");
      const fakePosition = {
        coords: { latitude: 43.6, longitude: 1.44 },
      } as GeolocationPosition;
      const geoMock = {
        getCurrentPosition: (success: PositionCallback) =>
          success(fakePosition),
      } as unknown as Geolocation;
      spyOnProperty(navigator, "geolocation", "get").and.returnValue(geoMock);

      service.locate().subscribe({
        next: (city: CityResult) => {
          expect(city.latitude).toBe(43.6);
          expect(city.longitude).toBe(1.44);
          expect(city.id).toBe(-1);
          done();
        },
        error: () => fail("ne devrait pas echouer"),
      });
    });

    it("devrait propager l'erreur de getCurrentPosition", (done) => {
      const service = configure("browser");
      const geoError = { code: 1, message: "User denied" };
      const geoMock = {
        getCurrentPosition: (
          _success: PositionCallback,
          error: PositionErrorCallback,
        ) => error(geoError as unknown as GeolocationPositionError),
      } as unknown as Geolocation;
      spyOnProperty(navigator, "geolocation", "get").and.returnValue(geoMock);

      service.locate().subscribe({
        next: () => fail("ne devrait pas emettre"),
        error: (err) => {
          expect(err.code).toBe(1);
          done();
        },
      });
    });
  });

  describe("reverseGeocode", () => {
    it("devrait deleguer au WeatherPort et retourner la ville", (done) => {
      const service = configure("browser");
      weatherPortStub.reverseGeocode.and.returnValue(of("Toulouse"));

      service.reverseGeocode(43.6, 1.44).subscribe((name) => {
        expect(name).toBe("Toulouse");
        expect(weatherPortStub.reverseGeocode).toHaveBeenCalledWith(43.6, 1.44);
        done();
      });
    });

    it("devrait retourner null si le port renvoie null", (done) => {
      const service = configure("browser");
      weatherPortStub.reverseGeocode.and.returnValue(of(null));

      service.reverseGeocode(0, 0).subscribe((name) => {
        expect(name).toBeNull();
        done();
      });
    });
  });
});
