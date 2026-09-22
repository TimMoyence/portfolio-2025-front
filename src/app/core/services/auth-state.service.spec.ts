import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ApplicationRef, PLATFORM_ID } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { AUTH_PORT, type AuthPort } from '../ports/auth.port';
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from '../../../testing/factories/auth.factory';
import { createVerrouEnMemoire } from '../../../testing/factories/verrou.factory';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { AuthStateService } from './auth-state.service';
import { VERROU_INTER_ONGLETS } from './verrou-inter-onglets';

function refusHttp(status: number): () => HttpErrorResponse {
  return () => new HttpErrorResponse({ status });
}

function limiteAtteinte(retryAfter?: string): () => HttpErrorResponse {
  const headers =
    retryAfter === undefined ? new HttpHeaders() : new HttpHeaders({ 'Retry-After': retryAfter });
  return () => new HttpErrorResponse({ status: 429, headers });
}

const CADENCE_D_UNE_ROTATION_MS = 15 * 60_000;

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
          { provide: VERROU_INTER_ONGLETS, useValue: createVerrouEnMemoire() },
        ],
      });
      service = TestBed.inject(AuthStateService);
    });

    afterEach(() => {
      service.clearSession();
    });

    it('restaure une session via le cookie HttpOnly sans persister le jeton', fakeAsync(() => {
      const session = buildAuthSession({ accessToken: 'jwt-restaure', expiresIn: 60 });
      portStub.refresh.and.returnValue(of(session));

      service.restoreSession();
      TestBed.inject(ApplicationRef).tick();

      expect(service.token()).toBe('jwt-restaure');
      expect(service.user()).toEqual(session.user);
      expect(portStub.refresh).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('portfolio_jwt')).toBeNull();
      expect(localStorage.getItem('portfolio_jwt_expire_le')).toBeNull();
    }));

    for (const status of [0, 503]) {
      it(`garde la session et retente un nombre borne de fois apres un echec ${status}`, fakeAsync(() => {
        portStub.refresh.and.returnValue(throwError(refusHttp(status)));
        service.login(buildAuthSession({ accessToken: 'jwt-initial', expiresIn: 60 }));

        tick(30_000);
        flushMicrotasks();

        expect(portStub.refresh).toHaveBeenCalledTimes(1);
        expect(service.token()).toBe('jwt-initial');

        tick(600_000);
        flushMicrotasks();
        const essais = portStub.refresh.calls.count();
        tick(600_000);
        flushMicrotasks();

        expect(essais).toBeGreaterThan(1);
        expect(portStub.refresh.calls.count()).withContext('nouvel essai borne').toBe(essais);
        expect(service.isLoggedIn()).toBeTrue();
      }));
    }

    it('reprend le cycle normal quand un nouvel essai aboutit', fakeAsync(() => {
      portStub.refresh.and.returnValues(
        throwError(refusHttp(502)),
        of(buildAuthSession({ accessToken: 'jwt-apres-panne', expiresIn: 900 })),
      );
      service.login(buildAuthSession({ accessToken: 'jwt-initial', expiresIn: 60 }));

      tick(30_000);
      flushMicrotasks();
      tick(30_000);
      flushMicrotasks();

      expect(portStub.refresh).toHaveBeenCalledTimes(2);
      expect(service.token()).toBe('jwt-apres-panne');
    }));

    describe('renouvellement refuse par la limite de cadence (429)', () => {
      it('retente apres le delai Retry-After en gardant la session', fakeAsync(() => {
        portStub.refresh.and.returnValues(
          throwError(limiteAtteinte('1800')),
          of(buildAuthSession({ accessToken: 'jwt-apres-limite', expiresIn: 900 })),
        );
        service.login(buildAuthSession({ accessToken: 'jwt-initial', expiresIn: 60 }));

        tick(30_000);
        flushMicrotasks();
        expect(portStub.refresh).toHaveBeenCalledTimes(1);
        expect(service.isLoggedIn()).toBeTrue();

        tick(1_799_999);
        flushMicrotasks();
        expect(portStub.refresh).toHaveBeenCalledTimes(1);

        tick(1);
        flushMicrotasks();
        expect(portStub.refresh).toHaveBeenCalledTimes(2);
        expect(service.token()).toBe('jwt-apres-limite');
      }));

      it('sans Retry-After, retente a la cadence d une rotation sans jamais s arreter', fakeAsync(() => {
        portStub.refresh.and.returnValue(throwError(limiteAtteinte()));
        service.login(buildAuthSession({ accessToken: 'jwt-initial', expiresIn: 60 }));

        tick(30_000);
        flushMicrotasks();

        for (let essai = 2; essai <= 8; essai += 1) {
          tick(CADENCE_D_UNE_ROTATION_MS - 1);
          flushMicrotasks();
          expect(portStub.refresh)
            .withContext(`pas d essai ${essai} avant une rotation`)
            .toHaveBeenCalledTimes(essai - 1);
          tick(1);
          flushMicrotasks();
          expect(portStub.refresh).withContext(`essai ${essai}`).toHaveBeenCalledTimes(essai);
        }
        expect(service.isLoggedIn()).toBeTrue();
        service.clearSession();
      }));

      it('un Retry-After plus court qu une rotation ne rapproche pas le nouvel essai', fakeAsync(() => {
        portStub.refresh.and.returnValue(throwError(limiteAtteinte('5')));
        service.login(buildAuthSession({ accessToken: 'jwt-initial', expiresIn: 60 }));

        tick(30_000);
        flushMicrotasks();
        tick(CADENCE_D_UNE_ROTATION_MS - 1);
        flushMicrotasks();

        expect(portStub.refresh).toHaveBeenCalledTimes(1);
        tick(1);
        flushMicrotasks();
        expect(portStub.refresh).toHaveBeenCalledTimes(2);
        service.clearSession();
      }));
    });

    it('efface la session quand le renouvellement est refuse en 401', fakeAsync(() => {
      portStub.refresh.and.returnValue(throwError(refusHttp(401)));
      service.login(buildAuthSession({ accessToken: 'jwt-initial', expiresIn: 60 }));

      tick(30_000);
      flushMicrotasks();

      expect(service.isLoggedIn()).toBeFalse();
      tick(600_000);
      flushMicrotasks();
      expect(portStub.refresh).toHaveBeenCalledTimes(1);
    }));

    describe('restauration via le cookie HttpOnly', () => {
      function restaurer(): void {
        service.restoreSession();
        TestBed.inject(ApplicationRef).tick();
      }

      for (const status of [0, 503]) {
        it(`signale un echec de restauration quand le refresh echoue en ${status}`, () => {
          portStub.refresh.and.returnValue(throwError(refusHttp(status)));

          restaurer();

          expect(service.token()).toBeNull();
          expect(service.user()).toBeNull();
          expect(service.isRestoreFailed()).toBeTrue();
          expect(service.isSessionResolved())
            .withContext('aucun garde ne doit juger le role sur une verification en echec')
            .toBeFalse();
        });
      }

      for (const status of [401, 403]) {
        it(`efface la session quand le refresh est refuse en ${status}`, () => {
          portStub.refresh.and.returnValue(throwError(refusHttp(status)));

          restaurer();

          expect(service.token()).toBeNull();
          expect(service.isRestoreFailed()).toBeFalse();
          expect(service.isSessionResolved()).toBeTrue();
        });
      }

      it('abandonne une restauration sans reponse apres dix secondes', fakeAsync(() => {
        portStub.refresh.and.returnValue(NEVER);

        restaurer();
        tick(9_999);

        expect(service.isRestoreFailed()).toBeFalse();

        tick(1);

        expect(service.isRestoreFailed()).toBeTrue();
        expect(service.token()).toBeNull();
      }));

      it('resout la session quand le nouvel essai aboutit', () => {
        portStub.refresh.and.returnValues(
          throwError(refusHttp(503)),
          of(buildAuthSession({ user: buildAuthUser({ roles: ['teacher'] }) })),
        );
        restaurer();

        service.restoreSession();

        expect(service.isRestoreFailed()).toBeFalse();
        expect(service.hasRole('teacher')).toBeTrue();
        expect(service.isSessionResolved()).toBeTrue();
      });
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
          user: {
            id: '1',
            email: 'a@b.com',
            firstName: 'A',
            lastName: 'B',
            phone: null,
            isActive: true,
            roles: ['weather', 'sebastian'],
          },
        }),
      );

      expect(service.hasRole('weather')).toBeTrue();
      expect(service.hasRole('sebastian')).toBeTrue();
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

    it('devrait appeler authPort.logout() sans parametre sur logout (cookie HttpOnly)', () => {
      const authPortStub = TestBed.inject(AUTH_PORT) as Record<keyof AuthPort, jasmine.Spy>;
      service.login(buildAuthSession());

      service.logout();

      expect(authPortStub.logout).toHaveBeenCalledWith();
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('devrait purger la session locale meme si la revocation serveur echoue', () => {
      const authPortStub = TestBed.inject(AUTH_PORT) as Record<keyof AuthPort, jasmine.Spy>;
      authPortStub.logout.and.returnValue(throwError(() => new Error('API injoignable')));
      service.login(buildAuthSession());

      expect(() => service.logout()).not.toThrow();

      expect(service.isLoggedIn()).toBeFalse();
      expect(service.user()).toBeNull();
    });

    it("devrait purger la session locale meme si le port jette avant d'emettre", () => {
      const authPortStub = TestBed.inject(AUTH_PORT) as Record<keyof AuthPort, jasmine.Spy>;
      authPortStub.logout.and.throwError('port indisponible');
      service.login(buildAuthSession());

      expect(() => service.logout()).not.toThrow();

      expect(service.isLoggedIn()).toBeFalse();
      expect(service.user()).toBeNull();
    });

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
