import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AUTH_PORT } from '../../../core/ports/auth.port';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { environment } from '../../../../environments/environment';
import { buildAuthSession, createAuthPortStub } from '../../../../testing/factories/auth.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authState: AuthStateService;
  let router: Router;

  beforeEach(() => {
    setupTestBed({
      http: false,
      router: true,
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AUTH_PORT, useValue: createAuthPortStub() },
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

  it('devrait ajouter le header Authorization aux requetes de notre API', () => {
    authState.login(buildAuthSession({ accessToken: 'mon-token-jwt' }));

    const url = `${environment.apiBaseUrl}/weather/forecast`;
    http.get(url).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.headers.get('Authorization')).toBe('Bearer mon-token-jwt');
    req.flush({});
  });

  it("devrait attacher le token aux requetes de l'API externe Sebastian (sous apiBaseUrl)", () => {
    authState.login(buildAuthSession({ accessToken: 'mon-token-jwt' }));

    const url = `${environment.external.sebastianUrl}/entries`;
    http.get(url).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.headers.get('Authorization')).toBe('Bearer mon-token-jwt');
    req.flush({});
  });

  it('devrait ne pas ajouter le header quand aucun token', () => {
    const url = `${environment.apiBaseUrl}/weather/forecast`;
    http.get(url).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('ne devrait PAS attacher le token a une requete externe RainViewer', () => {
    authState.login(buildAuthSession({ accessToken: 'mon-token-jwt' }));

    const url = 'https://api.rainviewer.com/public/weather-maps.json';
    http.get(url).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('ne devrait PAS attacher le token a une requete externe Nominatim', () => {
    authState.login(buildAuthSession({ accessToken: 'mon-token-jwt' }));

    const url = 'https://nominatim.openstreetmap.org/reverse?lat=48&lon=2';
    http.get(url).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('devrait appeler clearSession et naviguer vers /login sur erreur 401', () => {
    authState.login(buildAuthSession());
    spyOn(authState, 'clearSession').and.callThrough();
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    http.get('/api/protected').subscribe({
      next: () => fail('devrait echouer'),
      error: () => {
        expect(authState.clearSession).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
          queryParams: { returnUrl: router.url },
        });
      },
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush('Non autorise', { status: 401, statusText: 'Unauthorized' });
  });

  it('devrait propager les erreurs non-401 sans clearSession', () => {
    authState.login(buildAuthSession());
    spyOn(authState, 'clearSession');
    spyOn(router, 'navigate');

    http.get('/api/other').subscribe({
      next: () => fail('devrait echouer'),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(authState.clearSession).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
      },
    });

    const req = httpMock.expectOne('/api/other');
    req.flush('Erreur serveur', {
      status: 500,
      statusText: 'Internal Server Error',
    });
  });
});
