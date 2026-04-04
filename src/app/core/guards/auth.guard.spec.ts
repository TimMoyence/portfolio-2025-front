import { TestBed } from "@angular/core/testing";
import type { ActivatedRouteSnapshot } from "@angular/router";
import { provideRouter, UrlTree } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { AUTH_PORT } from "../ports/auth.port";
import { APP_CONFIG } from "../config/app-config.token";
import { AuthStateService } from "../services/auth-state.service";
import { environment } from "../../../environments/environnement";
import {
  buildAuthSession,
  createAuthPortStub,
} from "../../../testing/factories/auth.factory";
import { authGuard } from "./auth.guard";

/**
 * Tests unitaires du guard fonctionnel authGuard.
 * Verifie la protection des routes authentifiees :
 * - acces autorise si l'utilisateur est connecte
 * - redirection vers /login sinon
 */
describe("authGuard", () => {
  let authState: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AUTH_PORT, useValue: createAuthPortStub() },
        { provide: APP_CONFIG, useValue: environment },
      ],
    });

    authState = TestBed.inject(AuthStateService);
  });

  it("devrait autoriser l acces si l utilisateur est connecte", () => {
    authState.login(buildAuthSession());

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as never),
    );

    expect(result).toBeTrue();
  });

  it("devrait rediriger vers /login si l utilisateur n est pas connecte", () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as never),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe("/login");
  });
});
