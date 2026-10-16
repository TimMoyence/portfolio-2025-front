import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import type { Provider } from '@angular/core';
import { AuthHttpAdapter } from '../../../core/adapters/auth-http.adapter';
import { AUTH_PORT } from '../../../core/ports/auth.port';
import { AuthStateService } from '../../../core/services/auth-state.service';
import {
  VERROU_INTER_ONGLETS,
  creerVerrouInterOnglets,
  type VerrouInterOnglets,
} from '../../../core/services/verrou-inter-onglets';
import { environment } from '../../../../environments/environment';
import {
  buildAuthSession,
  buildReponseEn401,
  createAuthPortStub,
} from '../../../../testing/factories/auth.factory';
import { createVerrouEnMemoire } from '../../../../testing/factories/verrou.factory';
import { reveillerApres } from '../../../../testing/horloge-simulee';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { ENTETE_JETON_PARTICIPANT } from '../../../../cours/runtime/core/jeton-participant';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authState: AuthStateService;
  let router: Router;
  let port: ReturnType<typeof createAuthPortStub>;

  const LECTURES_DE_SEANCE = ['results', 'deroule'].map(
    (fin) => `${environment.apiBaseUrl}/formations/sessions/seance-1/${fin}`,
  );

  function monter(portFourni: Provider, verrou: VerrouInterOnglets): void {
    setupTestBed({
      http: false,
      router: true,
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        portFourni,
        { provide: VERROU_INTER_ONGLETS, useValue: verrou },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authState = TestBed.inject(AuthStateService);
    router = TestBed.inject(Router);
  }

  beforeEach(() => {
    port = createAuthPortStub();
    monter({ provide: AUTH_PORT, useValue: port }, createVerrouEnMemoire());
  });

  afterEach(() => {
    httpMock.verify();
  });

  function enTeteAuthorizationEnvoye(url: string): string | null {
    http.get(url).subscribe();
    const req = httpMock.expectOne(url);
    req.flush({});
    return req.request.headers.get('Authorization');
  }

  function statutsRecusApres401(
    url: string,
    headers: Record<string, string> = {},
    reponse = buildReponseEn401(),
  ): number[] {
    const statutsRecus: number[] = [];
    http
      .post(url, {}, { headers })
      .subscribe({ error: (erreur: HttpErrorResponse) => statutsRecus.push(erreur.status) });
    httpMock.expectOne(url).flush('Non autorise', reponse);
    return statutsRecus;
  }

  function repondreAuRafraichissement(reponse: string | number): void {
    port.refresh.and.returnValue(
      typeof reponse === 'string'
        ? of(buildAuthSession({ accessToken: reponse }))
        : throwError(() => new HttpErrorResponse({ status: reponse })),
    );
  }

  function connecterEtSurveiller(accessToken: string): jasmine.Spy {
    authState.login(buildAuthSession({ accessToken }));
    spyOn(authState, 'clearSession').and.callThrough();
    return spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  }

  function attendreLaSessionIntacte(
    statutsRecus: number[],
    navigate: jasmine.Spy,
    contexte: string,
  ): void {
    expect(statutsRecus).withContext(contexte).toEqual([401]);
    expect(authState.clearSession).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  }

  it('devrait ajouter le header Authorization aux requetes de notre API', () => {
    authState.login(buildAuthSession({ accessToken: 'mon-token-jwt' }));

    expect(enTeteAuthorizationEnvoye(`${environment.apiBaseUrl}/formations`)).toBe(
      'Bearer mon-token-jwt',
    );
  });

  it('devrait ne pas ajouter le header quand aucun token', () => {
    expect(enTeteAuthorizationEnvoye(`${environment.apiBaseUrl}/formations`)).toBeNull();
  });

  it('ne devrait PAS attacher le token a une requete vers un service tiers', () => {
    authState.login(buildAuthSession({ accessToken: 'mon-token-jwt' }));

    expect(enTeteAuthorizationEnvoye('https://tiers.example.com/reverse?lat=48&lon=2')).toBeNull();
  });

  it('devrait appeler clearSession et naviguer vers /login sur erreur 401 dont le rafraichissement est refuse', fakeAsync(() => {
    connecterEtSurveiller('jwt-token');
    repondreAuRafraichissement(401);
    const url = `${environment.apiBaseUrl}/formations/sessions`;
    let echecs = 0;

    http.get(url).subscribe({
      next: () => fail('devrait echouer'),
      error: () => {
        echecs += 1;
        expect(authState.clearSession).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
          queryParams: { returnUrl: router.url },
        });
      },
    });

    const req = httpMock.expectOne(url);
    req.flush('Non autorise', buildReponseEn401());
    flushMicrotasks();
    expect(echecs).toBe(1);
  }));

  it('laisse un 401 d un service tiers sans toucher a la session ni a la navigation', () => {
    const navigate = connecterEtSurveiller('jwt-en-cours');

    const statutsRecus = statutsRecusApres401('https://tiers.example.com/reverse?lat=48&lon=2');

    attendreLaSessionIntacte(statutsRecus, navigate, 'le 401 remonte a l appelant');
    expect(port.refresh).not.toHaveBeenCalled();
    expect(authState.token()).toBe('jwt-en-cours');
  });

  it('renvoie vers la cible de la navigation en cours quand le 401 survient avant qu elle aboutisse', fakeAsync(() => {
    const cible = '/cours/presenter/b2-01-traitement-information-chiffree?seance=seance-1';
    router.resetConfig([
      { path: 'cours/presenter/:slug', canActivate: [() => new Subject<boolean>()], children: [] },
    ]);
    authState.login(buildAuthSession());
    repondreAuRafraichissement(401);
    const navigate = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    void router.navigateByUrl(cible);
    flushMicrotasks();

    const url = `${environment.apiBaseUrl}/auth/me`;
    http.get(url).subscribe({ error: () => undefined });
    httpMock.expectOne(url).flush('Non autorise', buildReponseEn401());
    flushMicrotasks();

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
    repondreAuRafraichissement(401);

    for (const url of LECTURES_DE_SEANCE) {
      http.get(url).subscribe({ error: () => undefined });
    }
    for (const url of LECTURES_DE_SEANCE) {
      httpMock.expectOne(url).flush('Non autorise', buildReponseEn401());
    }
    flushMicrotasks();

    expect(router.url).toBe(
      `/login?returnUrl=${encodeURIComponent('/cours/seance/seance-1/synthese')}`,
    );
  }));

  it('laisse remonter un 401 sur une requete au jeton participant sans toucher a la session formateur', () => {
    const navigate = connecterEtSurveiller('jwt-formateur');
    const url = `${environment.apiBaseUrl}/formations/sessions/seance-1/answers`;

    const statutsRecus = statutsRecusApres401(url, {
      [ENTETE_JETON_PARTICIPANT]: 'jeton-participant',
    });

    attendreLaSessionIntacte(statutsRecus, navigate, 'le 401 remonte a l appelant');
    expect(authState.token()).toBe('jwt-formateur');
  });

  for (const route of [
    '/auth/login',
    '/auth/google',
    '/auth/change-password',
    '/auth/set-password',
    '/auth/logout',
  ]) {
    it(`laisse a l appelant un 401 de ${route} sans defi Bearer, qui juge des identifiants et non la session`, fakeAsync(() => {
      const navigate = connecterEtSurveiller('jwt-en-cours');
      const statutsRecus = statutsRecusApres401(
        `${environment.apiBaseUrl}${route}`,
        {},
        buildReponseEn401('identifiants'),
      );
      flushMicrotasks();

      attendreLaSessionIntacte(statutsRecus, navigate, 'le 401 remonte au formulaire');
      expect(port.refresh).withContext('ni rafraichissement ni rejeu').not.toHaveBeenCalled();
      expect(authState.token()).toBe('jwt-en-cours');
    }));
  }

  it('R3 · laisse aux gardes la destination quand le rafraichissement silencieux d un visiteur echoue en 401', () => {
    const navigate = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    const statutsRecus = statutsRecusApres401(`${environment.apiBaseUrl}/auth/refresh`);

    expect(statutsRecus).withContext('le 401 remonte a la restauration de session').toEqual([401]);
    expect(navigate).not.toHaveBeenCalled();
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

  describe('au reveil d une veille plus longue que le jeton, ou sur un jeton refuse', () => {
    const URL_DU_COMPTE = `${environment.apiBaseUrl}/auth/me`;

    function connecterPuisDormir(): void {
      authState.login(buildAuthSession({ accessToken: 'jwt-perime', expiresIn: 900 }));
      reveillerApres(3_600_000);
    }

    function lireLeCompte(): { corps: unknown[]; statuts: number[] } {
      const recu = { corps: [] as unknown[], statuts: [] as number[] };
      http.get(URL_DU_COMPTE).subscribe({
        next: (corps) => recu.corps.push(corps),
        error: (erreur: HttpErrorResponse) => recu.statuts.push(erreur.status),
      });
      return recu;
    }

    function refuserEn401(): void {
      httpMock.expectOne(URL_DU_COMPTE).flush('Non autorise', buildReponseEn401());
      flushMicrotasks();
    }

    function lireLeCompteAvecLeJetonNeuf(): void {
      repondreAuRafraichissement('jwt-neuf');

      lireLeCompte();
      flushMicrotasks();

      const requete = httpMock.expectOne(URL_DU_COMPTE);
      expect(requete.request.headers.get('Authorization')).toBe('Bearer jwt-neuf');
      expect(port.refresh).toHaveBeenCalledTimes(1);
      requete.flush({});
      authState.clearSession();
    }

    function lireLeCompteRefuseEn401(reponse: string | number) {
      repondreAuRafraichissement(reponse);
      const navigate = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
      const recu = lireLeCompte();
      refuserEn401();
      return { recu, navigate };
    }

    function attendreLaDeconnexion(navigate: jasmine.Spy): void {
      expect(authState.token()).toBeNull();
      expect(navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: router.url },
      });
    }

    it('rafraichit la session avant d envoyer une requete authentifiee, puis l envoie avec le jeton neuf', fakeAsync(() => {
      connecterPuisDormir();

      lireLeCompteAvecLeJetonNeuf();
    }));

    it('ne rafraichit qu une fois pour plusieurs requetes parties au reveil', fakeAsync(() => {
      connecterPuisDormir();
      repondreAuRafraichissement('jwt-neuf');

      for (const url of LECTURES_DE_SEANCE) {
        http.get(url).subscribe();
      }
      flushMicrotasks();

      for (const url of LECTURES_DE_SEANCE) {
        const requete = httpMock.expectOne(url);
        expect(requete.request.headers.get('Authorization')).toBe('Bearer jwt-neuf');
        requete.flush({});
      }
      expect(port.refresh).toHaveBeenCalledTimes(1);
      authState.clearSession();
    }));

    it('rafraichit aussi un jeton qui expirerait avant d arriver au serveur', fakeAsync(() => {
      authState.login(buildAuthSession({ accessToken: 'jwt-presque-perime', expiresIn: 900 }));
      reveillerApres(899_000);

      lireLeCompteAvecLeJetonNeuf();
    }));

    function lireLeCatalogueApresUnEchec(erreur: HttpErrorResponse): void {
      connecterPuisDormir();
      port.refresh.and.returnValue(throwError(() => erreur));
      const catalogue = `${environment.apiBaseUrl}/formations/courses`;

      for (let essai = 0; essai < 2; essai += 1) {
        http.get(catalogue).subscribe();
        flushMicrotasks();
        const requete = httpMock.expectOne(catalogue);
        expect(requete.request.headers.get('Authorization'))
          .withContext('aucune requete ne part avec le jeton expire')
          .toBeNull();
        requete.flush([]);
      }
      expect(authState.token()).toBe('jwt-perime');
    }

    it('apres un 429 du rafraichissement, n en relance aucun avant le delai Retry-After', fakeAsync(() => {
      lireLeCatalogueApresUnEchec(
        new HttpErrorResponse({
          status: 429,
          headers: new HttpHeaders({ 'Retry-After': '1800' }),
        }),
      );

      expect(port.refresh).toHaveBeenCalledTimes(1);
      authState.clearSession();
    }));

    for (const status of [0, 503]) {
      it(`apres un rafraichissement en echec ${status}, garde la session sans envoyer le jeton expire`, fakeAsync(() => {
        lireLeCatalogueApresUnEchec(new HttpErrorResponse({ status }));

        authState.clearSession();
      }));
    }

    it('au reveil, un rafraichissement refuse vide la session et laisse partir la requete sans jeton', fakeAsync(() => {
      connecterPuisDormir();
      repondreAuRafraichissement(401);
      const catalogue = `${environment.apiBaseUrl}/formations/courses`;

      http.get(catalogue).subscribe();
      flushMicrotasks();

      const requete = httpMock.expectOne(catalogue);
      expect(requete.request.headers.get('Authorization')).toBeNull();
      expect(authState.token()).toBeNull();
      requete.flush([]);
    }));

    it('sur un 401, rafraichit la session puis rejoue la requete une seule fois avec le jeton neuf', fakeAsync(() => {
      authState.login(buildAuthSession({ accessToken: 'jwt-refuse' }));
      const { recu, navigate } = lireLeCompteRefuseEn401('jwt-neuf');

      const rejouee = httpMock.expectOne(URL_DU_COMPTE);
      expect(rejouee.request.headers.get('Authorization')).toBe('Bearer jwt-neuf');
      rejouee.flush({ id: 'user-1' });

      expect(recu).toEqual({ corps: [{ id: 'user-1' }], statuts: [] });
      expect(navigate).not.toHaveBeenCalled();
      expect(authState.token()).toBe('jwt-neuf');
      authState.clearSession();
    }));

    it('sur un 401 dont le rafraichissement est refuse, vide la session et mene a /login', fakeAsync(() => {
      authState.login(buildAuthSession());
      const { recu, navigate } = lireLeCompteRefuseEn401(401);

      expect(recu.statuts).toEqual([401]);
      attendreLaDeconnexion(navigate);
    }));

    for (const status of [0, 503]) {
      it(`sur un 401 dont le rafraichissement echoue en ${status}, garde la session et laisse remonter le 401`, fakeAsync(() => {
        authState.login(buildAuthSession({ accessToken: 'jwt-en-cours' }));
        const { recu, navigate } = lireLeCompteRefuseEn401(status);

        expect(recu.statuts).toEqual([401]);
        expect(authState.token()).toBe('jwt-en-cours');
        expect(navigate).not.toHaveBeenCalled();
        authState.clearSession();
      }));
    }

    it('une requete rejouee qui reprend un 401 deconnecte, sans second rafraichissement', fakeAsync(() => {
      authState.login(buildAuthSession());
      const { recu, navigate } = lireLeCompteRefuseEn401('jwt-neuf');
      refuserEn401();

      expect(recu.statuts).toEqual([401]);
      expect(port.refresh).toHaveBeenCalledTimes(1);
      attendreLaDeconnexion(navigate);
    }));
  });

  describe('deconnexion au reveil, sans verrou inter-onglets', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      monter({ provide: AUTH_PORT, useClass: AuthHttpAdapter }, creerVerrouInterOnglets(null));
    });

    it('envoie la deconnexion sans rafraichir la session ni la ressusciter', fakeAsync(() => {
      authState.login(buildAuthSession({ accessToken: 'jwt-perime', expiresIn: 900 }));
      reveillerApres(3_600_000);

      authState.logout();
      flushMicrotasks();

      httpMock.expectNone(`${environment.apiBaseUrl}/auth/refresh`);
      const deconnexion = httpMock.expectOne(`${environment.apiBaseUrl}/auth/logout`);
      expect(deconnexion.request.headers.get('Authorization')).toBeNull();
      deconnexion.flush({ message: 'ok' });
      flushMicrotasks();
      expect(authState.isLoggedIn()).toBeFalse();
    }));
  });
});
