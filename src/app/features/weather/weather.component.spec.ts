import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { AUTH_PORT } from "../../core/ports/auth.port";
import { WEATHER_PORT } from "../../core/ports/weather.port";
import { AuthStateService } from "../../core/services/auth-state.service";
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from "../../../testing/factories/auth.factory";
import {
  buildWeatherPreferences,
  createWeatherPortStub,
} from "../../../testing/factories/weather.factory";
import { WeatherComponent } from "./weather.component";

describe("WeatherComponent", () => {
  let component: WeatherComponent;
  let fixture: ComponentFixture<WeatherComponent>;
  let authState: AuthStateService;

  beforeEach(async () => {
    const authPortStub = createAuthPortStub();
    authPortStub.login.and.returnValue(of(null));
    authPortStub.register.and.returnValue(of(null));
    authPortStub.me.and.returnValue(of(null));
    authPortStub.googleAuth.and.returnValue(of(null));

    const weatherPortStub = createWeatherPortStub();
    weatherPortStub.searchCity.and.returnValue(of({ results: [] }));
    weatherPortStub.getForecast.and.returnValue(of(null));
    weatherPortStub.getPreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );
    weatherPortStub.updatePreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );
    weatherPortStub.recordUsage.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [WeatherComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: AUTH_PORT, useValue: authPortStub },
        { provide: WEATHER_PORT, useValue: weatherPortStub },
      ],
    }).compileComponents();

    authState = TestBed.inject(AuthStateService);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(WeatherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("devrait se creer", () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it("devrait afficher le composant applicatif quand l utilisateur a le role weather", () => {
    // Arrange
    createComponent();
    authState.login(
      buildAuthSession({ user: buildAuthUser({ roles: ["weather"] }) }),
    );

    // Act
    fixture.detectChanges();

    // Assert
    const appEl = fixture.nativeElement.querySelector("app-weather-app");
    const presEl = fixture.nativeElement.querySelector(
      "app-weather-presentation",
    );
    expect(appEl).toBeTruthy();
    expect(presEl).toBeNull();
  });

  it("devrait afficher la presentation quand l utilisateur n est pas connecte", () => {
    // Arrange — aucun login

    // Act
    createComponent();

    // Assert
    const appEl = fixture.nativeElement.querySelector("app-weather-app");
    const presEl = fixture.nativeElement.querySelector(
      "app-weather-presentation",
    );
    expect(appEl).toBeNull();
    expect(presEl).toBeTruthy();
  });

  it("devrait afficher la presentation quand l utilisateur n a pas le role weather", () => {
    // Arrange
    createComponent();
    authState.login(
      buildAuthSession({ user: buildAuthUser({ roles: ["budget"] }) }),
    );

    // Act
    fixture.detectChanges();

    // Assert
    const appEl = fixture.nativeElement.querySelector("app-weather-app");
    const presEl = fixture.nativeElement.querySelector(
      "app-weather-presentation",
    );
    expect(appEl).toBeNull();
    expect(presEl).toBeTruthy();
  });

  it("hasAccess devrait retourner true si connecte avec le bon role", () => {
    // Arrange
    createComponent();
    authState.login(
      buildAuthSession({ user: buildAuthUser({ roles: ["weather"] }) }),
    );

    // Act
    fixture.detectChanges();

    // Assert
    expect(component.hasAccess()).toBeTrue();
  });

  it("hasAccess devrait retourner false si non connecte", () => {
    // Arrange — aucun login

    // Act
    createComponent();

    // Assert
    expect(component.hasAccess()).toBeFalse();
  });
});
