import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { HttpErrorResponse } from '@angular/common/http';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AUTH_PORT } from '../../../core/ports/auth.port';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { environment } from '../../../../environments/environment';
import { buildAuthSession, createAuthPortStub } from '../../../../testing/factories/auth.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { ENTETE_JETON_PARTICIPANT } from '../jeton-participant';
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

  it('renvoie vers la cible de la navigation en cours quand le 401 survient avant qu elle aboutisse', fakeAsync(() => {
    const cible = '/cours/presenter/b1-01-proportions?seance=seance-1';
    router.resetConfig([
      { path: 'cours/presenter/:slug', canActivate: [() => new Subject<boolean>()], children: [] },
    ]);
    authState.login(buildAuthSession());
    const navigate = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    void router.navigateByUrl(cible);
    flushMicrotasks();

    const url = `${environment.apiBaseUrl}/auth/me`;
    http.get(url).subscribe({ error: () => undefined });
    httpMock.expectOne(url).flush('Non autorise', { status: 401, statusText: 'Unauthorized' });

    expect(router.url).withContext('navigation initiale non validee').toBe('/');
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: cible } });
  }));

  it('garde la page d origine quand un second 401 arrive pendant la redirection vers /login', fakeAsync(() => {
    router.resetConfig([
      { path: 'cours/seance/:sessionId/synthese', children: [] },
      { path: 'login', children: [] },
    ]);
    void router.navigateByUrl('/cours/seance/seance-1/synthese');
    flushMicrotasks();
    authState.login(buildAuthSession());
    const lectures = ['results', 'deroule'].map(
      (fin) => `${environment.apiBaseUrl}/formations/sessions/seance-1/${fin}`,
    );

    for (const url of lectures) {
      http.get(url).subscribe({ error: () => undefined });
    }
    for (const url of lectures) {
      httpMock.expectOne(url).flush('Non autorise', { status: 401, statusText: 'Unauthorized' });
    }
    flushMicrotasks();

    expect(router.url).toBe(
      `/login?returnUrl=${encodeURIComponent('/cours/seance/seance-1/synthese')}`,
    );
  }));

  it('laisse remonter un 401 sur une requete au jeton participant sans toucher a la session formateur', () => {
    authState.login(buildAuthSession({ accessToken: 'jwt-formateur' }));
    spyOn(authState, 'clearSession').and.callThrough();
    const navigate = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    const url = `${environment.apiBaseUrl}/formations/sessions/seance-1/answers`;
    const statutsRecus: number[] = [];

    http
      .post(url, {}, { headers: { [ENTETE_JETON_PARTICIPANT]: 'jeton-participant' } })
      .subscribe({ error: (erreur: HttpErrorResponse) => statutsRecus.push(erreur.status) });
    httpMock.expectOne(url).flush('Non autorise', { status: 401, statusText: 'Unauthorized' });

    expect(statutsRecus).withContext('le 401 remonte a l appelant').toEqual([401]);
    expect(authState.clearSession).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(authState.token()).toBe('jwt-formateur');
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
