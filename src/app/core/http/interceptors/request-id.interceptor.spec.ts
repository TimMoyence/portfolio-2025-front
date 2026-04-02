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
import { requestIdInterceptor } from "./request-id.interceptor";

/**
 * Tests unitaires de l'intercepteur fonctionnel requestIdInterceptor.
 * Verifie l'ajout du header X-Request-Id et l'unicite des identifiants.
 */
describe("requestIdInterceptor", () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([requestIdInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("devrait ajouter un header X-Request-Id a chaque requete", () => {
    http.get("/api/test").subscribe();

    const req = httpMock.expectOne("/api/test");
    const requestId = req.request.headers.get("X-Request-Id");
    expect(requestId).toBeTruthy();
    expect(requestId!.length).toBeGreaterThan(0);
    req.flush({});
  });

  it("devrait generer des IDs differents pour chaque requete", () => {
    http.get("/api/first").subscribe();
    http.get("/api/second").subscribe();

    const reqs = httpMock.match(() => true);
    expect(reqs.length).toBe(2);

    const id1 = reqs[0].request.headers.get("X-Request-Id");
    const id2 = reqs[1].request.headers.get("X-Request-Id");

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);

    reqs[0].flush({});
    reqs[1].flush({});
  });
});
