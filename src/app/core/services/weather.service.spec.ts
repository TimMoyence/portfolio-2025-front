import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { WEATHER_PORT } from "../ports/weather.port";
import {
  buildEnsembleData,
  buildForecastResponse,
  buildHistoricalData,
  buildWeatherPreferences,
  createWeatherPortStub,
} from "../../../testing/factories/weather.factory";
import { WeatherService } from "./weather.service";

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

  it("devrait deleguer searchCity au port meteo", () => {
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

    service.searchCity("Paris").subscribe((result) => {
      expect(result).toEqual(response);
    });

    expect(weatherPortStub.searchCity).toHaveBeenCalledWith("Paris");
  });

  it("devrait deleguer getForecast au port meteo", () => {
    const response = buildForecastResponse();
    weatherPortStub.getForecast.and.returnValue(of(response));

    service.getForecast(48.85, 2.35).subscribe((result) => {
      expect(result).toEqual(response);
    });

    expect(weatherPortStub.getForecast).toHaveBeenCalledWith(48.85, 2.35);
  });

  it("devrait deleguer getPreferences au port meteo", () => {
    const prefs = buildWeatherPreferences({ level: "curious" });
    weatherPortStub.getPreferences.and.returnValue(of(prefs));

    service.getPreferences().subscribe((result) => {
      expect(result).toEqual(prefs);
    });

    expect(weatherPortStub.getPreferences).toHaveBeenCalled();
  });

  it("devrait deleguer updatePreferences au port meteo", () => {
    const prefs = buildWeatherPreferences({ level: "expert" });
    weatherPortStub.updatePreferences.and.returnValue(of(prefs));

    service.updatePreferences({ level: "expert" }).subscribe((result) => {
      expect(result).toEqual(prefs);
    });

    expect(weatherPortStub.updatePreferences).toHaveBeenCalledWith({
      level: "expert",
    });
  });

  it("devrait deleguer recordUsage au port meteo", () => {
    weatherPortStub.recordUsage.and.returnValue(of(undefined));

    service.recordUsage().subscribe();

    expect(weatherPortStub.recordUsage).toHaveBeenCalled();
  });

  it("devrait deleguer getEnsemble au port meteo", () => {
    const response = buildEnsembleData();
    weatherPortStub.getEnsemble.and.returnValue(of(response));

    service.getEnsemble(48.85, 2.35).subscribe((result) => {
      expect(result).toEqual(response);
    });

    expect(weatherPortStub.getEnsemble).toHaveBeenCalledWith(48.85, 2.35);
  });

  it("devrait deleguer getHistorical au port meteo", () => {
    const response = buildHistoricalData();
    weatherPortStub.getHistorical.and.returnValue(of(response));

    service
      .getHistorical(48.85, 2.35, "2026-03-01", "2026-03-30")
      .subscribe((result) => {
        expect(result).toEqual(response);
      });

    expect(weatherPortStub.getHistorical).toHaveBeenCalledWith(
      48.85,
      2.35,
      "2026-03-01",
      "2026-03-30",
    );
  });
});
