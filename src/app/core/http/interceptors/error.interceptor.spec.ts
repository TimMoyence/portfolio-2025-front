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
import { errorInterceptor } from "./error.interceptor";

/**
 * Tests unitaires de l'intercepteur fonctionnel errorInterceptor.
 * Verifie la propagation des erreurs HTTP et le passage des requetes reussies.
 */
describe("errorInterceptor", () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("devrait propager l erreur HTTP via throwError", () => {
    http.get("/api/fail").subscribe({
      next: () => fail("devrait echouer"),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(error.statusText).toBe("Internal Server Error");
      },
    });

    const req = httpMock.expectOne("/api/fail");
    req.flush("Erreur serveur", {
      status: 500,
      statusText: "Internal Server Error",
    });
  });

  it("devrait laisser passer les requetes reussies", () => {
    const body = { message: "ok" };

    http.get("/api/success").subscribe((result) => {
      expect(result).toEqual(body);
    });

    const req = httpMock.expectOne("/api/success");
    req.flush(body);
  });
});
