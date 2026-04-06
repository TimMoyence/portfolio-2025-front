import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { AUTH_PORT } from "../ports/auth.port";
import { APP_CONFIG } from "../config/app-config.token";
import { environment } from "../../../environments/environment";
import {
  buildAuthSession,
  createAuthPortStub,
} from "../../../testing/factories/auth.factory";
import { AuthStateService } from "./auth-state.service";

/**
 * Tests unitaires de AuthStateService.
 * Verifie le signal isInitialized et la gestion de session.
 */
describe("AuthStateService", () => {
  describe("en contexte navigateur", () => {
    let service: AuthStateService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: "browser" },
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: AUTH_PORT, useValue: createAuthPortStub() },
          { provide: APP_CONFIG, useValue: environment },
        ],
      });
      service = TestBed.inject(AuthStateService);
    });

    it("devrait se creer", () => {
      expect(service).toBeTruthy();
    });

    it("devrait avoir isInitialized a false avant afterNextRender", () => {
      // afterNextRender ne s'execute pas dans le contexte de test navigateur
      expect(service.isInitialized()).toBeFalse();
    });

    it("devrait avoir isLoggedIn a false par defaut", () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it("devrait exposer le token et le user apres login", () => {
      const session = buildAuthSession();
      service.login(session);

      expect(service.isLoggedIn()).toBeTrue();
      expect(service.token()).toBe(session.accessToken);
      expect(service.user()).toEqual(session.user);
    });

    it("devrait reinitialiser le state apres logout", () => {
      service.login(buildAuthSession());
      service.logout();

      expect(service.isLoggedIn()).toBeFalse();
      expect(service.token()).toBeNull();
      expect(service.user()).toBeNull();
    });

    it("devrait verifier les roles via hasRole", () => {
      service.login(
        buildAuthSession({
          user: {
            id: "1",
            email: "a@b.com",
            firstName: "A",
            lastName: "B",
            phone: null,
            isActive: true,
            roles: ["weather", "budget"],
          },
        }),
      );

      expect(service.hasRole("weather")).toBeTrue();
      expect(service.hasRole("budget")).toBeTrue();
      expect(service.hasRole("admin")).toBeFalse();
    });
  });

  describe("en contexte SSR (serveur)", () => {
    let service: AuthStateService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: "server" },
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: AUTH_PORT, useValue: createAuthPortStub() },
          { provide: APP_CONFIG, useValue: environment },
        ],
      });
      service = TestBed.inject(AuthStateService);
    });

    it("devrait avoir isInitialized a true immediatement en SSR", () => {
      expect(service.isInitialized()).toBeTrue();
    });

    it("devrait avoir isLoggedIn a false en SSR (pas de localStorage)", () => {
      expect(service.isLoggedIn()).toBeFalse();
    });
  });
});
