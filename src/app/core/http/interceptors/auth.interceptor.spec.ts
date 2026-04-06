import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { AUTH_PORT } from "../../../core/ports/auth.port";
import { APP_CONFIG } from "../../../core/config/app-config.token";
import { AuthStateService } from "../../../core/services/auth-state.service";
import { environment } from "../../../../environments/environment";
import {
  buildAuthSession,
  createAuthPortStub,
} from "../../../../testing/factories/auth.factory";
import { authInterceptor } from "./auth.interceptor";

/**
 * Tests unitaires de l'intercepteur fonctionnel authInterceptor.
 * Verifie l'ajout du header Authorization et la gestion des erreurs 401.
 */
describe("authInterceptor", () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authState: AuthStateService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AUTH_PORT, useValue: createAuthPortStub() },
        { provide: APP_CONFIG, useValue: environment },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authState = TestBed.inject(AuthStateService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("devrait ajouter le header Authorization quand un token existe", () => {
    authState.login(buildAuthSession({ accessToken: "mon-token-jwt" }));

    http.get("/api/test").subscribe();

    const req = httpMock.expectOne("/api/test");
    expect(req.request.headers.get("Authorization")).toBe(
      "Bearer mon-token-jwt",
    );
    req.flush({});
  });

  it("devrait ne pas ajouter le header quand aucun token", () => {
    http.get("/api/test").subscribe();

    const req = httpMock.expectOne("/api/test");
    expect(req.request.headers.has("Authorization")).toBeFalse();
    req.flush({});
  });

  it("devrait appeler logout et naviguer vers /login sur erreur 401", () => {
    authState.login(buildAuthSession());
    spyOn(authState, "logout").and.callThrough();
    spyOn(router, "navigate").and.returnValue(Promise.resolve(true));

    http.get("/api/protected").subscribe({
      next: () => fail("devrait echouer"),
      error: () => {
        expect(authState.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(["/login"], {
          queryParams: { returnUrl: router.url },
        });
      },
    });

    const req = httpMock.expectOne("/api/protected");
    req.flush("Non autorise", { status: 401, statusText: "Unauthorized" });
  });

  it("devrait propager les erreurs non-401 sans logout", () => {
    authState.login(buildAuthSession());
    spyOn(authState, "logout");
    spyOn(router, "navigate");

    http.get("/api/other").subscribe({
      next: () => fail("devrait echouer"),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(authState.logout).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
      },
    });

    const req = httpMock.expectOne("/api/other");
    req.flush("Erreur serveur", {
      status: 500,
      statusText: "Internal Server Error",
    });
  });
});
