import { TestBed } from "@angular/core/testing";
import type { ActivatedRouteSnapshot } from "@angular/router";
import { provideRouter, UrlTree } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { AUTH_PORT } from "../ports/auth.port";
import { APP_CONFIG } from "../config/app-config.token";
import { AuthStateService } from "../services/auth-state.service";
import { environment } from "../../../environments/environment";
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from "../../../testing/factories/auth.factory";
import { roleGuard } from "./role.guard";

/**
 * Tests unitaires du guard fonctionnel roleGuard.
 * Verifie la protection des routes par role :
 * - acces autorise si l'utilisateur possede le role requis
 * - redirection vers / si le role manque
 * - redirection vers / si l'utilisateur n'est pas connecte
 */
describe("roleGuard", () => {
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

  it("devrait autoriser l acces si l utilisateur possede le role requis", () => {
    authState.login(
      buildAuthSession({ user: buildAuthUser({ roles: ["budget"] }) }),
    );

    const guard = roleGuard("budget");
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as never),
    );

    expect(result).toBeTrue();
  });

  it("devrait rediriger vers / si l utilisateur ne possede pas le role", () => {
    authState.login(
      buildAuthSession({ user: buildAuthUser({ roles: ["weather"] }) }),
    );

    const guard = roleGuard("budget");
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as never),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe("/");
  });

  it("devrait rediriger vers / si l utilisateur n est pas connecte", () => {
    const guard = roleGuard("budget");
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as never),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe("/");
  });
});
