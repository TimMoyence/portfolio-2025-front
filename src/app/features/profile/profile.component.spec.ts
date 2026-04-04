import { signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
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
    updateUser: jasmine.createSpy("updateUser"),
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

  /* ========================= EDIT PROFILE ========================= */

  describe("mode edition du profil", () => {
    it("startEditing pre-remplit les champs et active le mode edition", () => {
      expect(component.isEditing()).toBeFalse();

      component.startEditing();

      expect(component.isEditing()).toBeTrue();
      expect(component.editFirstName).toBe("Jean");
      expect(component.editLastName).toBe("Dupont");
      expect(component.editPhone).toBe("");
    });

    it("startEditing pre-remplit le telephone quand il est renseigne", () => {
      authState.user.set(buildAuthUser({ phone: "+33612345678" }));

      component.startEditing();

      expect(component.editPhone).toBe("+33612345678");
    });

    it("cancelEditing revient en mode lecture", () => {
      component.startEditing();
      expect(component.isEditing()).toBeTrue();

      component.cancelEditing();
      expect(component.isEditing()).toBeFalse();
    });

    it("cancelEditing efface les messages de succes et erreur", () => {
      component.editProfileSuccess = "ok";
      component.editProfileError = "erreur";

      component.cancelEditing();

      expect(component.editProfileSuccess).toBeUndefined();
      expect(component.editProfileError).toBeUndefined();
    });

    it("saveProfile appelle updateProfile et met a jour le state", () => {
      const updatedUser = buildAuthUser({
        firstName: "Pierre",
        lastName: "Martin",
        phone: "+33600000000",
      });
      authService.updateProfile.and.returnValue(of(updatedUser));

      component.startEditing();
      component.editFirstName = "Pierre";
      component.editLastName = "Martin";
      component.editPhone = "+33600000000";
      component.saveProfile();

      expect(authService.updateProfile).toHaveBeenCalledWith({
        firstName: "Pierre",
        lastName: "Martin",
        phone: "+33600000000",
      });
      expect(authState.updateUser).toHaveBeenCalledWith(updatedUser);
      expect(component.editProfileSuccess).toBeDefined();
      expect(component.isEditing()).toBeFalse();
    });

    it("saveProfile envoie null pour un telephone vide", () => {
      authService.updateProfile.and.returnValue(of(buildAuthUser()));

      component.startEditing();
      component.editPhone = "";
      component.saveProfile();

      expect(authService.updateProfile).toHaveBeenCalledWith(
        jasmine.objectContaining({ phone: null }),
      );
    });

    it("saveProfile affiche une erreur en cas d'echec", () => {
      authService.updateProfile.and.returnValue(
        throwError(() => ({ error: { message: "Erreur serveur" } })),
      );

      component.startEditing();
      component.saveProfile();

      expect(component.editProfileError).toBeDefined();
      expect(component.isEditing()).toBeTrue();
    });
  });
});
