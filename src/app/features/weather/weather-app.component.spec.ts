import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { AUTH_PORT } from "../../core/ports/auth.port";
import { WEATHER_PORT } from "../../core/ports/weather.port";
import { createAuthPortStub } from "../../../testing/factories/auth.factory";
import {
  buildCityResult,
  buildEnsembleData,
  buildForecastResponse,
  buildHistoricalData,
  buildWeatherPreferences,
  createWeatherPortStub,
} from "../../../testing/factories/weather.factory";
import { WeatherAppComponent } from "./weather-app.component";

describe("WeatherAppComponent", () => {
  let component: WeatherAppComponent;
  let fixture: ComponentFixture<WeatherAppComponent>;
  let weatherPortStub: ReturnType<typeof createWeatherPortStub>;
  let authPortStub: ReturnType<typeof createAuthPortStub>;

  beforeEach(async () => {
    weatherPortStub = createWeatherPortStub();
    authPortStub = createAuthPortStub();

    // Configuration par defaut des stubs
    weatherPortStub.searchCity.and.returnValue(of({ results: [] }));
    weatherPortStub.getForecast.and.returnValue(of(buildForecastResponse()));
    weatherPortStub.getPreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );
    weatherPortStub.updatePreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );
    weatherPortStub.recordUsage.and.returnValue(of(undefined));
    weatherPortStub.getDetailedCurrent.and.returnValue(of(null));
    weatherPortStub.getDetailedForecast.and.returnValue(of(null));

    authPortStub.login.and.returnValue(of(null));
    authPortStub.register.and.returnValue(of(null));
    authPortStub.me.and.returnValue(of(null));
    authPortStub.googleAuth.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [WeatherAppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: AUTH_PORT, useValue: authPortStub },
        { provide: WEATHER_PORT, useValue: weatherPortStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait initialiser les signaux a leur valeur par defaut", () => {
    expect(component.forecast()).toBeNull();
    expect(component.selectedCity()).toBeNull();
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
    expect(component.ensemble()).toBeNull();
    expect(component.historical()).toBeNull();
    expect(component.alerts()).toEqual([]);
    expect(component.defaultCityIndex()).toBeNull();
  });

  it("devrait charger les preferences au demarrage", () => {
    expect(weatherPortStub.getPreferences).toHaveBeenCalled();
  });

  it("devrait enregistrer l'utilisation au demarrage", () => {
    expect(weatherPortStub.recordUsage).toHaveBeenCalled();
  });

  it("devrait charger les previsions lors de la selection d'une ville", () => {
    const city = buildCityResult();

    component.onCitySelected(city);

    expect(component.selectedCity()).toEqual(city);
    expect(component.forecast()).toEqual(buildForecastResponse());
    expect(component.loading()).toBeFalse();
    expect(weatherPortStub.getForecast).toHaveBeenCalledWith(
      48.85,
      2.35,
      undefined,
      7,
    );
  });

  it("devrait gerer les erreurs de chargement", () => {
    weatherPortStub.getForecast.and.returnValue(
      throwError(() => ({ error: { message: "Erreur test" } })),
    );

    component.onCitySelected(buildCityResult());

    expect(component.error()).toBe("Erreur test");
    expect(component.loading()).toBeFalse();
    expect(component.forecast()).toBeNull();
  });

  it("devrait retourner un fond neutre sans previsions", () => {
    expect(component.backgroundClasses()).toBe("");
    expect(component.hasForecast()).toBeFalse();
  });

  it("devrait calculer le gradient dynamique selon le code meteo", () => {
    component.onCitySelected(buildCityResult());

    // Code 0 = ciel degage → gradient sky/blue
    expect(component.backgroundClasses()).toContain("from-sky-400");
  });

  it("devrait exposer le levelService pour le template", () => {
    expect(component.levelService).toBeDefined();
    expect(component.levelService.level()).toBe("discovery");
  });

  it("devrait charger les donnees ensemble et historique en mode expert", () => {
    weatherPortStub.getAirQuality.and.returnValue(
      of({
        current: {
          european_aqi: 25,
          pm2_5: 8,
          pm10: 15,
          ozone: 52,
          nitrogen_dioxide: 12,
          sulphur_dioxide: 3,
        },
        hourly: { time: [], european_aqi: [], pm2_5: [], pm10: [], ozone: [] },
      }),
    );
    weatherPortStub.getEnsemble.and.returnValue(of(buildEnsembleData()));
    weatherPortStub.getHistorical.and.returnValue(of(buildHistoricalData()));

    component.levelService.level.set("expert");
    component.onCitySelected(buildCityResult());

    expect(weatherPortStub.getEnsemble).toHaveBeenCalledWith(48.85, 2.35);
    expect(weatherPortStub.getHistorical).toHaveBeenCalled();
    expect(component.ensemble()).toEqual(buildEnsembleData());
    expect(component.historical()).toEqual(buildHistoricalData());
  });

  it("devrait ne pas charger ensemble/historique en mode discovery", () => {
    component.levelService.level.set("discovery");
    component.onCitySelected(buildCityResult());

    expect(weatherPortStub.getEnsemble).not.toHaveBeenCalled();
    expect(weatherPortStub.getHistorical).not.toHaveBeenCalled();
  });

  it("devrait extraire la valeur CAPE du modele GFS", () => {
    component.ensemble.set(buildEnsembleData());

    const cape = component.extractCape();
    expect(cape).toBe(750);
  });

  it("devrait retourner null pour extractCape sans donnees ensemble", () => {
    expect(component.extractCape()).toBeNull();
  });
});
