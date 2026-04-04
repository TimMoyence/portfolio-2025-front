import { signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { AUTH_PORT } from "../../core/ports/auth.port";
import { WEATHER_PORT } from "../../core/ports/weather.port";
import { AuthStateService } from "../../core/services/auth-state.service";
import { WeatherLevelService } from "../weather/services/weather-level.service";
import {
  buildAuthUser,
  createAuthPortStub,
} from "../../../testing/factories/auth.factory";
import {
  createWeatherPortStub,
  buildWeatherPreferences,
} from "../../../testing/factories/weather.factory";
import { ProfileComponent } from "./profile.component";

function createAuthStateMock(
  overrides?: Partial<{ hasPassword: boolean; roles: string[] }>,
) {
  const user = buildAuthUser({
    hasPassword: overrides?.hasPassword ?? false,
    roles: overrides?.roles ?? ["weather"],
  });
  return {
    restoreSession: jasmine.createSpy("restoreSession"),
    user: signal(user),
    isLoggedIn: signal(true),
    hasRole: (role: string) => user.roles.includes(role),
  };
}

function createWeatherPortMock() {
  const stub = createWeatherPortStub();
  stub.getPreferences.and.returnValue(
    of(
      buildWeatherPreferences({
        level: "curious",
        favoriteCities: [
          {
            name: "Paris",
            latitude: 48.85,
            longitude: 2.35,
            country: "France",
          },
        ],
        daysUsed: 12,
      }),
    ),
  );
  stub.updatePreferences.and.returnValue(
    of(buildWeatherPreferences({ favoriteCities: [] })),
  );
  stub.recordUsage.and.returnValue(of(void 0));
  return stub;
}

describe("ProfileComponent", () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: ReturnType<typeof createAuthPortStub>;
  let authState: ReturnType<typeof createAuthStateMock>;

  beforeEach(async () => {
    authService = createAuthPortStub();
    authState = createAuthStateMock();

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        { provide: AUTH_PORT, useValue: authService },
        { provide: AuthStateService, useValue: authState },
        { provide: WEATHER_PORT, useValue: createWeatherPortMock() },
        WeatherLevelService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("appelle setPassword et rafraichit la session", () => {
    authService.setPassword.and.returnValue(
      of(buildAuthUser({ hasPassword: true })),
    );

    component.newPassword = "NewPassword123!";
    component.setPassword({
      invalid: false,
      resetForm: jasmine.createSpy("resetForm"),
    } as never);

    expect(authService.setPassword).toHaveBeenCalledWith({
      newPassword: "NewPassword123!",
    });
    expect(authState.restoreSession).toHaveBeenCalled();
    expect(component.setPasswordSuccess).toBeDefined();
  });

  it("charge les preferences meteo au init", () => {
    expect(component.favoriteCities.length).toBe(1);
    expect(component.favoriteCities[0].name).toBe("Paris");
  });

  it("supprime une ville favorite", () => {
    const city = component.favoriteCities[0];
    component.removeFavoriteCity(city);
    expect(component.favoriteCities.length).toBe(0);
  });
});
