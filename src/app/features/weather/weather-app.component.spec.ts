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
import { GeolocationService } from "./services/geolocation.service";
import { WeatherAppComponent } from "./weather-app.component";

describe("WeatherAppComponent", () => {
  let component: WeatherAppComponent;
  let fixture: ComponentFixture<WeatherAppComponent>;
  let weatherPortStub: ReturnType<typeof createWeatherPortStub>;
  let authPortStub: ReturnType<typeof createAuthPortStub>;
  let geoServiceSpy: jasmine.SpyObj<GeolocationService>;

  beforeEach(async () => {
    weatherPortStub = createWeatherPortStub();
    authPortStub = createAuthPortStub();
    geoServiceSpy = jasmine.createSpyObj("GeolocationService", [
      "locate",
      "reverseGeocode",
    ]);

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

    // Par defaut, la geolocalisation echoue (pas de permission)
    geoServiceSpy.locate.and.returnValue(
      throwError(() => new Error("Geolocation non disponible")),
    );

    await TestBed.configureTestingModule({
      imports: [WeatherAppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: AUTH_PORT, useValue: authPortStub },
        { provide: WEATHER_PORT, useValue: weatherPortStub },
        { provide: GeolocationService, useValue: geoServiceSpy },
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

  // --- Tests Phase 4 : parallax ---

  it("devrait initialiser scrollY a 0", () => {
    expect(component.scrollY()).toBe(0);
  });

  it("devrait calculer parallaxOffset avec un max de 60", () => {
    component.scrollY.set(100);
    expect(component.parallaxOffset()).toBe(15);

    component.scrollY.set(500);
    expect(component.parallaxOffset()).toBe(60);
  });

  // --- Tests Phase 4 : transition ville ---

  it("devrait activer contentTransitioning quand on change de ville avec des donnees", () => {
    // Charger une premiere ville
    component.onCitySelected(buildCityResult());
    expect(component.forecast()).toBeTruthy();

    // Changer de ville → transition
    component.onCitySelected(
      buildCityResult({ name: "Lyon", latitude: 45.75, longitude: 4.85 }),
    );
    expect(component.contentTransitioning()).toBeTrue();
  });

  it("devrait ne pas activer contentTransitioning sans donnees prealables", () => {
    // Premier chargement, pas de forecast encore
    component.onCitySelected(buildCityResult());
    expect(component.contentTransitioning()).toBeFalse();
  });

  // --- Tests Phase 4 : geolocalisation automatique ---

  it("devrait tenter la geolocalisation si pas de ville par defaut", () => {
    // getPreferences retourne deja des prefs sans defaultCityIndex
    // la geolocalisation est appelee dans loadFavorites()
    expect(geoServiceSpy.locate).toHaveBeenCalled();
  });

  it("devrait charger la meteo apres geolocalisation reussie", () => {
    // Reconfigurer pour une geolocalisation reussie
    const geoCity = buildCityResult({
      id: -1,
      name: "Ma position",
      latitude: 43.6,
      longitude: 1.44,
      country: "",
    });
    geoServiceSpy.locate.and.returnValue(of(geoCity));
    geoServiceSpy.reverseGeocode.and.returnValue(of("Toulouse"));

    // Re-declencher loadFavorites via ngOnInit
    component.ngOnInit();

    // Verifie que la ville geolocisee a ete chargee
    expect(geoServiceSpy.reverseGeocode).toHaveBeenCalledWith(43.6, 1.44);
    expect(component.selectedCity()).toBeTruthy();
    expect(component.selectedCity()?.name).toBe("Toulouse");
  });

  it("devrait ne pas appeler geoloc si ville par defaut existe", () => {
    geoServiceSpy.locate.calls.reset();
    weatherPortStub.getPreferences.and.returnValue(
      of(
        buildWeatherPreferences({
          favoriteCities: [
            {
              name: "Paris",
              latitude: 48.85,
              longitude: 2.35,
              country: "France",
            },
          ],
          defaultCityIndex: 0,
        }),
      ),
    );

    component.ngOnInit();

    expect(geoServiceSpy.locate).not.toHaveBeenCalled();
  });
});
