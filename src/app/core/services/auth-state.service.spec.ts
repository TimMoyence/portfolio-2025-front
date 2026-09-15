import { HttpErrorResponse } from '@angular/common/http';
import type { EnvironmentInjector as InjecteurEnvironnement } from '@angular/core';
import {
  ApplicationRef,
  createEnvironmentInjector,
  EnvironmentInjector,
  PLATFORM_ID,
} from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AUTH_PORT, type AuthPort } from '../ports/auth.port';
import { buildAuthSession, createAuthPortStub } from '../../../testing/factories/auth.factory';
import { createVerrouEnMemoire } from '../../../testing/factories/verrou.factory';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { AuthStateService } from './auth-state.service';
import { VERROU_INTER_ONGLETS } from './verrou-inter-onglets';

const CLE_DU_JETON = 'portfolio_jwt';
const CLE_D_EXPIRATION = 'portfolio_jwt_expire_le';

function refusHttp(status: number): () => HttpErrorResponse {
  return () => new HttpErrorResponse({ status });
}

describe('AuthStateService', () => {
  describe('en contexte navigateur', () => {
    let service: AuthStateService;
    let portStub: Record<keyof AuthPort, jasmine.Spy>;
    const autresFenetres: InjecteurEnvironnement[] = [];

    function ouvrirUneAutreFenetre(): AuthStateService {
      const injecteur = createEnvironmentInjector(
        [AuthStateService],
        TestBed.inject(EnvironmentInjector),
      );
      autresFenetres.push(injecteur);
      return injecteur.get(AuthStateService);
    }

    function jetonEcritParUneAutreFenetre(jeton: string, expireDansMs: number): void {
      localStorage.setItem(CLE_D_EXPIRATION, String(Date.now() + expireDansMs));
      localStorage.setItem(CLE_DU_JETON, jeton);
      window.dispatchEvent(new StorageEvent('storage', { key: CLE_DU_JETON, newValue: jeton }));
    }

    beforeEach(() => {
      localStorage.removeItem(CLE_DU_JETON);
      localStorage.removeItem(CLE_D_EXPIRATION);
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
      for (const injecteur of autresFenetres) {
        injecteur.destroy();
      }
      autresFenetres.length = 0;
      service.clearSession();
      localStorage.removeItem(CLE_DU_JETON);
      localStorage.removeItem(CLE_D_EXPIRATION);
    });

    it('arme le renouvellement d une session restauree comme apres une connexion', fakeAsync(() => {
      localStorage.setItem(CLE_D_EXPIRATION, String(Date.now() + 60_000));
      localStorage.setItem(CLE_DU_JETON, 'jwt-restaure');
      portStub.refresh.and.returnValue(of(buildAuthSession({ accessToken: 'jwt-renouvele' })));

      TestBed.inject(ApplicationRef).tick();

      expect(service.token()).toBe('jwt-restaure');
      tick(29_999);
      flushMicrotasks();
      expect(portStub.refresh).not.toHaveBeenCalled();

      tick(1);
      flushMicrotasks();

      expect(portStub.refresh).toHaveBeenCalledTimes(1);
      expect(service.token()).toBe('jwt-renouvele');
      expect(localStorage.getItem(CLE_DU_JETON)).toBe('jwt-renouvele');
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
        expect(localStorage.getItem(CLE_DU_JETON)).toBe('jwt-initial');
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

    it('efface la session quand le renouvellement est refuse en 401', fakeAsync(() => {
      portStub.refresh.and.returnValue(throwError(refusHttp(401)));
      service.login(buildAuthSession({ accessToken: 'jwt-initial', expiresIn: 60 }));

      tick(30_000);
      flushMicrotasks();

      expect(service.isLoggedIn()).toBeFalse();
      expect(localStorage.getItem(CLE_DU_JETON)).toBeNull();
      tick(600_000);
      flushMicrotasks();
      expect(portStub.refresh).toHaveBeenCalledTimes(1);
    }));

    it('deux fenetres qui arrivent a echeance ensemble ne renouvellent qu une fois', fakeAsync(() => {
      portStub.refresh.and.returnValue(
        of(buildAuthSession({ accessToken: 'jwt-renouvele', expiresIn: 900 })),
      );
      const scene = ouvrirUneAutreFenetre();
      const session = buildAuthSession({ accessToken: 'jwt-initial', expiresIn: 60 });
      service.login(session);
      scene.login(session);

      tick(30_000);
      flushMicrotasks();

      expect(portStub.refresh).toHaveBeenCalledTimes(1);
      expect(service.token()).toBe('jwt-renouvele');
      expect(scene.token()).toBe('jwt-renouvele');
    }));

    it('adopte le jeton renouvele par une autre fenetre et repousse son propre renouvellement', fakeAsync(() => {
      service.login(buildAuthSession({ accessToken: 'jwt-initial', expiresIn: 60 }));

      jetonEcritParUneAutreFenetre('jwt-autre-fenetre', 900_000);

      expect(service.token()).toBe('jwt-autre-fenetre');
      tick(60_000);
      flushMicrotasks();
      expect(portStub.refresh).not.toHaveBeenCalled();

      tick(810_000);
      flushMicrotasks();
      expect(portStub.refresh).toHaveBeenCalledTimes(1);
    }));

    it('n adopte pas le jeton d une autre fenetre quand aucune session n est ouverte ici', () => {
      jetonEcritParUneAutreFenetre('jwt-autre-fenetre', 900_000);

      expect(service.token()).toBeNull();
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

    it('ne devrait plus stocker de refreshToken en localStorage (cookie HttpOnly)', () => {
      const session = buildAuthSession();
      service.login(session);

      expect(localStorage.getItem('portfolio_refresh')).toBeNull();
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
      expect(localStorage.getItem('portfolio_jwt')).toBeNull();
    });

    it("devrait purger la session locale meme si le port jette avant d'emettre", () => {
      const authPortStub = TestBed.inject(AUTH_PORT) as Record<keyof AuthPort, jasmine.Spy>;
      authPortStub.logout.and.throwError('port indisponible');
      service.login(buildAuthSession());

      expect(() => service.logout()).not.toThrow();

      expect(service.isLoggedIn()).toBeFalse();
      expect(service.user()).toBeNull();
      expect(localStorage.getItem('portfolio_jwt')).toBeNull();
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
