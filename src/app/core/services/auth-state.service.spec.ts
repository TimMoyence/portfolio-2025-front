import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import {
  ApplicationRef,
  EnvironmentInjector,
  PLATFORM_ID,
  createEnvironmentInjector,
} from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NEVER, Subject, of, throwError } from 'rxjs';
import type { AuthSession, AuthUser } from '../models/auth.model';
import { AUTH_PORT, type AuthPort } from '../ports/auth.port';
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from '../../../testing/factories/auth.factory';
import { reveillerApres } from '../../../testing/horloge-simulee';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { AuthStateService } from './auth-state.service';
import { PLUS_LONGUE_FENETRE_MS } from './fenetre-de-renouvellement';

function refusHttp(status: number): () => HttpErrorResponse {
  return () => new HttpErrorResponse({ status });
}

function limiteAtteinte(retryAfter?: string): () => HttpErrorResponse {
  const headers =
    retryAfter === undefined ? new HttpHeaders() : new HttpHeaders({ 'Retry-After': retryAfter });
  return () => new HttpErrorResponse({ status: 429, headers });
}

const CADENCE_D_UNE_ROTATION_MS = 15 * 60_000;
const REFRESH_ACCEPTES_PAR_HEURE = 60;
const RECUL_EN_PANNE_MS = 120_000;

describe('AuthStateService', () => {
  describe('en contexte navigateur', () => {
    let service: AuthStateService;
    let portStub: Record<keyof AuthPort, jasmine.Spy>;

    beforeEach(() => {
      portStub = createAuthPortStub();
      setupTestBed({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: AUTH_PORT, useValue: portStub },
        ],
      });
      service = TestBed.inject(AuthStateService);
    });

    afterEach(() => {
      service.clearSession();
    });

    function avancer(ms: number): void {
      tick(ms);
      flushMicrotasks();
    }

    function atteindreLePremierRenouvellement(): void {
      service.login(buildAuthSession({ accessToken: 'jwt-initial', expiresIn: 60 }));
      avancer(30_000);
    }

    function attendreLaSessionVide(): void {
      expect(service.isLoggedIn()).toBeFalse();
      expect(service.user()).toBeNull();
    }

    function demanderUnRafraichissement(): string[] {
      const issues: string[] = [];
      void service.rafraichirLaSession().then((issue) => issues.push(issue));
      flushMicrotasks();
      return issues;
    }

    function attendreLeDeuxiemeEssaiApres(delaiMs: number): void {
      avancer(delaiMs - 1);
      expect(portStub.refresh).toHaveBeenCalledTimes(1);
      avancer(1);
      expect(portStub.refresh).toHaveBeenCalledTimes(2);
    }

    it('restaure une session via le cookie HttpOnly sans persister le jeton', fakeAsync(() => {
      const session = buildAuthSession({ accessToken: 'jwt-restaure', expiresIn: 60 });
      portStub.refresh.and.returnValue(of(session));

      service.restoreSession();
      TestBed.inject(ApplicationRef).tick();
      flushMicrotasks();

      expect(service.token()).toBe('jwt-restaure');
      expect(service.user()).toEqual(session.user);
      expect(portStub.refresh).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('portfolio_jwt')).toBeNull();
      expect(localStorage.getItem('portfolio_jwt_expire_le')).toBeNull();
    }));

    for (const status of [0, 503]) {
      it(`garde la session et retente un nombre borne de fois apres un echec ${status}`, fakeAsync(() => {
        portStub.refresh.and.returnValue(throwError(refusHttp(status)));
        atteindreLePremierRenouvellement();

        expect(portStub.refresh).toHaveBeenCalledTimes(1);
        expect(service.token()).toBe('jwt-initial');

        avancer(600_000);
        const essais = portStub.refresh.calls.count();
        avancer(600_000);

        expect(essais).toBeGreaterThan(1);
        expect(portStub.refresh.calls.count()).withContext('nouvel essai borne').toBe(essais);
        expect(service.isLoggedIn()).toBeTrue();
      }));
    }

    it('sous une panne du refresh, ne relance pas plus de refresh par heure que le serveur n en accepte, bandeau compris', fakeAsync(() => {
      portStub.refresh.and.returnValue(throwError(refusHttp(503)));
      service.login(buildAuthSession({ accessToken: 'jwt-perime', expiresIn: 60 }));

      for (let passage = 0; passage < 120; passage += 1) {
        avancer(30_000);
        service.relireLeCompte().subscribe();
        flushMicrotasks();
      }

      expect(portStub.refresh.calls.count()).toBeLessThanOrEqual(REFRESH_ACCEPTES_PAR_HEURE);
      expect(service.isLoggedIn()).toBeTrue();

      portStub.refresh.and.returnValue(of(buildAuthSession({ accessToken: 'jwt-retabli' })));
      avancer(RECUL_EN_PANNE_MS);
      service.relireLeCompte().subscribe();
      flushMicrotasks();

      expect(service.token())
        .withContext('la panne finie, le bandeau suivant rouvre')
        .toBe('jwt-retabli');
      service.clearSession();
    }));

    it('sous une panne du refresh, le pupitre et la projection, qui partagent le cookie, ne relancent pas ensemble plus de refresh par heure que le serveur n en accepte', fakeAsync(() => {
      const projection = createEnvironmentInjector(
        [AuthStateService],
        TestBed.inject(EnvironmentInjector),
      );
      const onglets = [service, projection.get(AuthStateService)];
      portStub.refresh.and.returnValue(throwError(refusHttp(503)));
      for (const onglet of onglets) {
        onglet.login(buildAuthSession({ accessToken: 'jwt-perime', expiresIn: 60 }));
      }

      for (let passage = 0; passage < 120; passage += 1) {
        avancer(30_000);
        for (const onglet of onglets) {
          onglet.relireLeCompte().subscribe();
          void onglet.rafraichirLaSession();
        }
        flushMicrotasks();
      }

      expect(portStub.refresh.calls.count()).toBeLessThanOrEqual(REFRESH_ACCEPTES_PAR_HEURE);
      expect(onglets.map((onglet) => onglet.isLoggedIn())).toEqual([true, true]);
      projection.destroy();
    }));

    it('ne garde pas apres une reconnexion la limite de cadence de la session precedente', fakeAsync(() => {
      portStub.refresh.and.returnValue(throwError(limiteAtteinte('3600')));
      atteindreLePremierRenouvellement();
      portStub.refresh.and.returnValue(of(buildAuthSession({ accessToken: 'jwt-apres-veille' })));

      service.login(buildAuthSession({ accessToken: 'jwt-reconnecte', expiresIn: 900 }));
      reveillerApres(20 * 60_000);
      const issues = demanderUnRafraichissement();

      expect(issues).toEqual(['reussi']);
      expect(service.token()).toBe('jwt-apres-veille');
      service.clearSession();
    }));

    it('apres un echec transitoire, un appel a la demande attend l essai du minuteur sans en lancer un autre', fakeAsync(() => {
      portStub.refresh.and.returnValue(throwError(refusHttp(503)));
      atteindreLePremierRenouvellement();

      const issues = demanderUnRafraichissement();

      expect(issues).toEqual(['injoignable']);
      attendreLeDeuxiemeEssaiApres(2_000);
    }));

    it('reprend le cycle normal quand un nouvel essai aboutit', fakeAsync(() => {
      portStub.refresh.and.returnValues(
        throwError(refusHttp(502)),
        of(buildAuthSession({ accessToken: 'jwt-apres-panne', expiresIn: 900 })),
      );
      atteindreLePremierRenouvellement();
      avancer(30_000);

      expect(portStub.refresh).toHaveBeenCalledTimes(2);
      expect(service.token()).toBe('jwt-apres-panne');
    }));

    it('traite un renouvellement reste sans reponse dix secondes comme une panne du reseau, puis le rejoue', fakeAsync(() => {
      portStub.refresh.and.returnValues(
        NEVER,
        of(buildAuthSession({ accessToken: 'jwt-apres-silence', expiresIn: 900 })),
      );
      atteindreLePremierRenouvellement();
      attendreLeDeuxiemeEssaiApres(10_000 + 2_000);

      expect(service.token()).toBe('jwt-apres-silence');
    }));

    describe('renouvellement refuse par la limite de cadence (429)', () => {
      it('retente apres le delai Retry-After en gardant la session', fakeAsync(() => {
        portStub.refresh.and.returnValues(
          throwError(limiteAtteinte('1800')),
          of(buildAuthSession({ accessToken: 'jwt-apres-limite', expiresIn: 900 })),
        );
        atteindreLePremierRenouvellement();
        expect(portStub.refresh).toHaveBeenCalledTimes(1);
        expect(service.isLoggedIn()).toBeTrue();

        attendreLeDeuxiemeEssaiApres(1_800_000);
        expect(service.token()).toBe('jwt-apres-limite');
      }));

      it('sans Retry-After, retente a la cadence d une rotation sans jamais s arreter', fakeAsync(() => {
        portStub.refresh.and.returnValue(throwError(limiteAtteinte()));
        atteindreLePremierRenouvellement();

        for (let essai = 2; essai <= 8; essai += 1) {
          avancer(CADENCE_D_UNE_ROTATION_MS - 1);
          expect(portStub.refresh)
            .withContext(`pas d essai ${essai} avant une rotation`)
            .toHaveBeenCalledTimes(essai - 1);
          avancer(1);
          expect(portStub.refresh).withContext(`essai ${essai}`).toHaveBeenCalledTimes(essai);
        }
        expect(service.isLoggedIn()).toBeTrue();
        service.clearSession();
      }));

      it('un Retry-After plus court qu une rotation ne rapproche pas le nouvel essai', fakeAsync(() => {
        portStub.refresh.and.returnValue(throwError(limiteAtteinte('5')));
        atteindreLePremierRenouvellement();

        attendreLeDeuxiemeEssaiApres(CADENCE_D_UNE_ROTATION_MS);
        service.clearSession();
      }));
    });

    it('efface la session quand le renouvellement est refuse en 401', fakeAsync(() => {
      portStub.refresh.and.returnValue(throwError(refusHttp(401)));
      atteindreLePremierRenouvellement();

      expect(service.isLoggedIn()).toBeFalse();
      avancer(600_000);
      expect(portStub.refresh).toHaveBeenCalledTimes(1);
    }));

    describe('relecture du compte au reveil d une veille plus longue que le jeton', () => {
      function relireAuReveil(): void {
        reveillerApres(3_600_000);
        service.relireLeCompte().subscribe();
        flushMicrotasks();
        expect(portStub.me).not.toHaveBeenCalled();
      }

      it('vide la session quand le rafraichissement est refuse en 401', fakeAsync(() => {
        service.login(buildAuthSession({ accessToken: 'jwt-perime', expiresIn: 900 }));
        portStub.refresh.and.returnValue(throwError(refusHttp(401)));

        relireAuReveil();

        attendreLaSessionVide();
      }));

      it('rejoint le rafraichissement deja lance par le minuteur, sans en lancer un second', fakeAsync(() => {
        const reponse = new Subject<AuthSession>();
        portStub.refresh.and.returnValue(reponse);
        atteindreLePremierRenouvellement();
        expect(portStub.refresh).toHaveBeenCalledTimes(1);

        relireAuReveil();
        expect(portStub.refresh).toHaveBeenCalledTimes(1);

        reponse.next(buildAuthSession({ accessToken: 'jwt-neuf' }));
        reponse.complete();
        flushMicrotasks();
        expect(service.token()).toBe('jwt-neuf');
        service.clearSession();
      }));
    });

    describe('deconnexion pendant un rafraichissement en vol', () => {
      let reponse: Subject<AuthSession>;

      beforeEach(() => {
        reponse = new Subject<AuthSession>();
        portStub.refresh.and.returnValue(reponse);
      });

      function repondreApresLaDeconnexion(): void {
        service.logout();
        reponse.next(buildAuthSession({ accessToken: 'jwt-ressuscite' }));
        reponse.complete();
        flushMicrotasks();
      }

      function attendreLaDeconnexionDefinitive(): void {
        attendreLaSessionVide();
        avancer(3_600_000);
        expect(portStub.refresh).withContext('aucun minuteur re-arme').toHaveBeenCalledTimes(1);
      }

      it('ne ressuscite pas la session quand la reponse du reveil arrive apres la deconnexion', fakeAsync(() => {
        service.login(buildAuthSession({ accessToken: 'jwt-perime', expiresIn: 900 }));
        reveillerApres(3_600_000);
        const issues = demanderUnRafraichissement();

        repondreApresLaDeconnexion();

        expect(issues).toEqual(['refuse']);
        attendreLaDeconnexionDefinitive();
      }));

      it('ne ressuscite pas la session quand la reponse du minuteur arrive apres la deconnexion', fakeAsync(() => {
        atteindreLePremierRenouvellement();
        expect(portStub.refresh).toHaveBeenCalledTimes(1);

        repondreApresLaDeconnexion();

        attendreLaDeconnexionDefinitive();
      }));

      it('ne reporte pas sur la session suivante la limite de cadence d un rafraichissement abandonne', fakeAsync(() => {
        service.login(buildAuthSession({ accessToken: 'jwt-perime', expiresIn: 900 }));
        reveillerApres(3_600_000);
        void service.rafraichirLaSession();
        flushMicrotasks();
        service.logout();
        reponse.error(limiteAtteinte('1800')());
        flushMicrotasks();

        portStub.refresh.and.returnValue(of(buildAuthSession({ accessToken: 'jwt-suivant' })));
        service.login(buildAuthSession({ accessToken: 'jwt-reconnecte', expiresIn: 900 }));
        void service.rafraichirLaSession();
        flushMicrotasks();

        expect(portStub.refresh).toHaveBeenCalledTimes(2);
        expect(service.token()).toBe('jwt-suivant');
        service.clearSession();
      }));

      for (const [chemin, lancer] of [
        ['la relecture du compte', (etat: AuthStateService) => etat.relireLeCompte().subscribe()],
        ['la restauration', (etat: AuthStateService) => etat.restoreSession()],
      ] as const) {
        it(`ne connecte pas une session que ${chemin} ramene apres un effacement`, fakeAsync(() => {
          lancer(service);
          flushMicrotasks();
          expect(portStub.refresh).toHaveBeenCalledTimes(1);

          service.clearSession();
          reponse.next(buildAuthSession({ accessToken: 'jwt-ressuscite' }));
          reponse.complete();
          flushMicrotasks();

          attendreLaSessionVide();
        }));

        it(`ne rend pas le compte que ${chemin} relit apres une deconnexion`, fakeAsync(() => {
          const compte = new Subject<AuthUser>();
          portStub.me.and.returnValue(compte);
          service.login(buildAuthSession({ accessToken: 'jwt-valide', expiresIn: 900 }));
          lancer(service);
          expect(portStub.me).toHaveBeenCalledTimes(1);

          service.logout();
          compte.next(buildAuthUser({ roles: ['formateur'] }));
          compte.complete();
          flushMicrotasks();

          attendreLaSessionVide();
          expect(service.hasRole('formateur')).toBeFalse();
        }));
      }

      it('ne signale pas l echec d une restauration abandonnee par une deconnexion', fakeAsync(() => {
        const compte = new Subject<AuthUser>();
        portStub.me.and.returnValue(compte);
        service.login(buildAuthSession({ accessToken: 'jwt-valide', expiresIn: 900 }));
        service.restoreSession();

        service.logout();
        compte.error(refusHttp(503)());
        flushMicrotasks();

        expect(service.isRestoreFailed()).toBeFalse();
        attendreLaSessionVide();
      }));
    });

    describe('restauration via le cookie HttpOnly', () => {
      function restaurer(): void {
        service.restoreSession();
        TestBed.inject(ApplicationRef).tick();
        flushMicrotasks();
      }

      function restaurerSansJetonApresUnRefus(status: number): void {
        portStub.refresh.and.returnValue(throwError(refusHttp(status)));

        restaurer();

        expect(service.token()).toBeNull();
      }

      for (const status of [0, 503]) {
        it(`signale un echec de restauration quand le refresh echoue en ${status}`, fakeAsync(() => {
          restaurerSansJetonApresUnRefus(status);

          expect(service.user()).toBeNull();
          expect(service.isRestoreFailed()).toBeTrue();
          expect(service.isSessionResolved())
            .withContext('aucun garde ne doit juger le role sur une verification en echec')
            .toBeFalse();
        }));
      }

      for (const status of [401, 403]) {
        it(`efface la session quand le refresh est refuse en ${status}`, fakeAsync(() => {
          restaurerSansJetonApresUnRefus(status);

          expect(service.isRestoreFailed()).toBeFalse();
          expect(service.isSessionResolved()).toBeTrue();
        }));
      }

      it('une relecture du compte lancee pendant la restauration rejoint son rafraichissement, sans en lancer un second', fakeAsync(() => {
        const reponse = new Subject<AuthSession>();
        portStub.refresh.and.returnValue(reponse);

        service.restoreSession();
        service.relireLeCompte().subscribe();
        flushMicrotasks();
        reponse.next(buildAuthSession({ accessToken: 'jwt-restaure' }));
        reponse.complete();
        flushMicrotasks();

        expect(portStub.refresh).toHaveBeenCalledTimes(1);
        expect(service.token()).toBe('jwt-restaure');
      }));

      it('sous une panne du refresh, une relecture du compte sans jeton attend la fin du recul', fakeAsync(() => {
        portStub.refresh.and.returnValue(throwError(refusHttp(503)));

        for (let lecture = 0; lecture < 2; lecture += 1) {
          service.relireLeCompte().subscribe();
          flushMicrotasks();
        }

        expect(portStub.refresh).toHaveBeenCalledTimes(1);
      }));

      it('abandonne une restauration sans reponse apres dix secondes', fakeAsync(() => {
        portStub.refresh.and.returnValue(NEVER);

        restaurer();
        tick(9_999);

        expect(service.isRestoreFailed()).toBeFalse();

        tick(1);

        expect(service.isRestoreFailed()).toBeTrue();
        expect(service.token()).toBeNull();
      }));

      for (const { cause, refus } of [
        { cause: 'une panne', refus: refusHttp(503) },
        { cause: 'une limite de cadence de 30 s', refus: limiteAtteinte('30') },
      ]) {
        it(`resout la session quand le nouvel essai aboutit, aussitot apres ${cause}`, fakeAsync(() => {
          portStub.refresh.and.returnValues(
            throwError(refus),
            of(buildAuthSession({ user: buildAuthUser({ roles: ['teacher'] }) })),
          );
          restaurer();

          restaurer();

          expect(portStub.refresh).toHaveBeenCalledTimes(2);
          expect(service.isRestoreFailed()).toBeFalse();
          expect(service.hasRole('teacher')).toBeTrue();
          expect(service.isSessionResolved()).toBeTrue();
        }));

        it(`restaure la session d une page rechargee aussitot apres ${cause}`, fakeAsync(() => {
          portStub.refresh.and.returnValues(
            throwError(refus),
            of(buildAuthSession({ accessToken: 'jwt-recharge' })),
          );
          restaurer();
          const pageRechargee = createEnvironmentInjector(
            [AuthStateService],
            TestBed.inject(EnvironmentInjector),
          );
          const rechargee = pageRechargee.get(AuthStateService);

          rechargee.restoreSession();
          flushMicrotasks();

          expect(portStub.refresh).toHaveBeenCalledTimes(2);
          expect(rechargee.token()).toBe('jwt-recharge');
          expect(rechargee.isRestoreFailed()).toBeFalse();
          rechargee.clearSession();
          pageRechargee.destroy();
        }));
      }

      it('relance le refresh au nouvel essai quand le precedent est reste sans reponse', fakeAsync(() => {
        portStub.refresh.and.returnValues(
          NEVER,
          of(buildAuthSession({ accessToken: 'jwt-relance' })),
        );
        restaurer();
        tick(10_000);
        expect(service.isRestoreFailed()).toBeTrue();

        restaurer();

        expect(portStub.refresh).toHaveBeenCalledTimes(2);
        expect(service.token()).toBe('jwt-relance');
      }));
    });

    it('devrait se creer', () => {
      expect(service).toBeTruthy();
    });

    it("devrait avoir isInitialized a false tant qu'afterNextRender n'a pas ete execute", () => {
      expect(service.isInitialized()).toBeFalse();
    });

    it('devrait avoir isLoggedIn a false par defaut', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('devrait exposer le token et le user apres login', () => {
      const session = buildAuthSession();
      service.login(session);

      expect(service.isLoggedIn()).toBeTrue();
      expect(service.token()).toBe(session.accessToken);
      expect(service.user()).toEqual(session.user);
    });

    it('devrait reinitialiser le state apres clearSession', () => {
      service.login(buildAuthSession());
      service.clearSession();

      expect(service.isLoggedIn()).toBeFalse();
      expect(service.token()).toBeNull();
      expect(service.user()).toBeNull();
    });

    it('devrait verifier les roles via hasRole', () => {
      service.login(
        buildAuthSession({
          user: buildAuthUser({
            id: '1',
            email: 'a@b.com',
            firstName: 'A',
            lastName: 'B',
            roles: ['user', 'teacher'],
          }),
        }),
      );

      expect(service.hasRole('user')).toBeTrue();
      expect(service.hasRole('teacher')).toBeTrue();
      expect(service.hasRole('admin')).toBeFalse();
    });

    it('ne stocke aucun jeton de session en localStorage', () => {
      const session = buildAuthSession();
      service.login(session);

      expect(localStorage.getItem('portfolio_refresh')).toBeNull();
      expect(localStorage.getItem('portfolio_jwt')).toBeNull();
      expect(localStorage.getItem('portfolio_jwt_expire_le')).toBeNull();
    });

    it('devrait planifier le refresh du token avant expiration', fakeAsync(() => {
      const authPortStub = TestBed.inject(AUTH_PORT) as Record<keyof AuthPort, jasmine.Spy>;
      const renewedSession = buildAuthSession({
        accessToken: 'jwt-renewed',
        expiresIn: 3600,
      });
      authPortStub.refresh.and.returnValue(of(renewedSession));

      const expiresInS = 60;
      const refreshMarginS = 30;
      const expectedRefreshDelayMs = (expiresInS - refreshMarginS) * 1000;

      service.login(
        buildAuthSession({
          accessToken: 'jwt-initial',
          expiresIn: expiresInS,
        }),
      );

      tick(expectedRefreshDelayMs);

      expect(authPortStub.refresh).toHaveBeenCalled();
      expect(service.token()).toBe('jwt-renewed');
    }));

    it('ne relance pas le refresh en boucle quand la duree du jeton depasse ce que tient un minuteur', async () => {
      service.login(buildAuthSession({ accessToken: 'jwt-long', expiresIn: 40 * 24 * 60 * 60 }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(portStub.refresh).not.toHaveBeenCalled();
    });

    it('ne relance qu un refresh par plus longue fenetre quand la duree du jeton est illisible', fakeAsync(() => {
      const illisible = buildAuthSession({ accessToken: 'jwt-illisible', expiresIn: Number.NaN });
      portStub.refresh.and.returnValue(of(illisible));
      service.login(illisible);

      avancer(PLUS_LONGUE_FENETRE_MS - 1);
      expect(portStub.refresh).not.toHaveBeenCalled();
      avancer(1);
      expect(portStub.refresh).toHaveBeenCalledTimes(1);
      avancer(PLUS_LONGUE_FENETRE_MS - 1);
      expect(portStub.refresh).toHaveBeenCalledTimes(1);
    }));

    it('devrait appeler authPort.logout() sans parametre sur logout (cookie HttpOnly)', () => {
      const authPortStub = TestBed.inject(AUTH_PORT) as Record<keyof AuthPort, jasmine.Spy>;
      service.login(buildAuthSession());

      service.logout();

      expect(authPortStub.logout).toHaveBeenCalledWith();
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('deconnecte puis mene a l accueil par logoutEtAccueil', () => {
      const naviguer = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      service.login(buildAuthSession());

      service.logoutEtAccueil();

      expect(portStub.logout).toHaveBeenCalledWith();
      expect(service.isLoggedIn()).toBeFalse();
      expect(naviguer).toHaveBeenCalledOnceWith(['/']);
    });

    const echecsDeRevocation: readonly [string, (logout: jasmine.Spy) => void][] = [
      [
        'la revocation serveur echoue',
        (logout) => logout.and.returnValue(throwError(() => new Error('API injoignable'))),
      ],
      ["le port jette avant d'emettre", (logout) => logout.and.throwError('port indisponible')],
    ];

    for (const [cas, echouer] of echecsDeRevocation) {
      it(`devrait purger la session locale meme si ${cas}`, () => {
        const authPortStub = TestBed.inject(AUTH_PORT) as Record<keyof AuthPort, jasmine.Spy>;
        echouer(authPortStub.logout);
        service.login(buildAuthSession());

        expect(() => service.logout()).not.toThrow();

        expect(service.isLoggedIn()).toBeFalse();
        expect(service.user()).toBeNull();
      });
    }

    it('devrait annuler le timer de refresh au logout', fakeAsync(() => {
      const authPortStub = TestBed.inject(AUTH_PORT) as Record<keyof AuthPort, jasmine.Spy>;

      service.login(buildAuthSession({ expiresIn: 120 }));
      service.logout();

      tick(120_000);

      expect(authPortStub.refresh).not.toHaveBeenCalled();
    }));

    it('devrait annuler le timer au clearSession', fakeAsync(() => {
      const authPortStub = TestBed.inject(AUTH_PORT) as Record<keyof AuthPort, jasmine.Spy>;

      service.login(buildAuthSession({ expiresIn: 120 }));
      service.clearSession();

      tick(120_000);

      expect(authPortStub.refresh).not.toHaveBeenCalled();
    }));
  });

  describe('en contexte SSR (serveur)', () => {
    let service: AuthStateService;

    beforeEach(() => {
      setupTestBed({
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: AUTH_PORT, useValue: createAuthPortStub() },
        ],
      });
      service = TestBed.inject(AuthStateService);
    });

    it('devrait avoir isInitialized a true immediatement en SSR', () => {
      expect(service.isInitialized()).toBeTrue();
    });

    it('devrait avoir isLoggedIn a false en SSR (pas de localStorage)', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });
  });
});
