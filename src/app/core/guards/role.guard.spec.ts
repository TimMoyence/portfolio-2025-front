import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, GuardResult, RouterStateSnapshot } from '@angular/router';
import { UrlTree } from '@angular/router';
import { isObservable, Subject } from 'rxjs';
import { AUTH_PORT } from '../ports/auth.port';
import { AuthStateService } from '../services/auth-state.service';
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from '../../../testing/factories/auth.factory';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { roleGuard } from './role.guard';

const REDIRECTION_FORMATEUR = '/contact?reason=access&app=teacher';

describe('roleGuard', () => {
  let authState: AuthStateService;
  let sessionRestauree: Subject<ReturnType<typeof buildAuthSession>>;
  let port: ReturnType<typeof createAuthPortStub>;

  function decisionsDe(requis: string): GuardResult[] {
    const recues: GuardResult[] = [];
    const resultat = TestBed.runInInjectionContext(() =>
      roleGuard(requis)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    if (isObservable(resultat)) {
      resultat.subscribe((decision) => recues.push(decision));
    } else {
      recues.push(resultat as GuardResult);
    }
    return recues;
  }

  function rendreLaPage(): void {
    TestBed.inject(ApplicationRef).tick();
  }

  beforeEach(() => {
    sessionRestauree = new Subject<ReturnType<typeof buildAuthSession>>();
    port = createAuthPortStub();
    port.refresh.and.returnValue(sessionRestauree);
    setupTestBed({
      router: true,
      providers: [{ provide: AUTH_PORT, useValue: port }],
    });

    authState = TestBed.inject(AuthStateService);
  });

  afterEach(() => {
    authState.clearSession();
  });

  it('devrait autoriser l acces si l utilisateur possede le role requis', () => {
    authState.login(buildAuthSession({ user: buildAuthUser({ roles: ['teacher'] }) }));

    expect(decisionsDe('teacher')).toEqual([true]);
  });

  it('devrait rediriger vers /contact avec queryParams si l utilisateur ne possede pas le role', () => {
    authState.login(buildAuthSession({ user: buildAuthUser({ roles: ['user'] }) }));

    const [decision] = decisionsDe('teacher');

    expect(decision).toBeInstanceOf(UrlTree);
    expect(String(decision)).toBe(REDIRECTION_FORMATEUR);
  });

  it('devrait rediriger vers /contact une fois la session resolue sans jeton', () => {
    sessionRestauree.error(new HttpErrorResponse({ status: 401 }));
    const decisions = decisionsDe('teacher');

    rendreLaPage();
    rendreLaPage();

    expect(decisions.length).toBe(1);
    expect(decisions[0]).toBeInstanceOf(UrlTree);
    expect(String(decisions[0])).toBe(REDIRECTION_FORMATEUR);
  });

  describe('au chargement d une page avec un cookie de refresh', () => {
    it('attend la session restauree et autorise le role qu elle porte', () => {
      const decisions = decisionsDe('teacher');

      rendreLaPage();
      rendreLaPage();

      expect(authState.isInitialized()).toBeTrue();
      expect(decisions)
        .withContext('aucune decision tant que l utilisateur n est pas revenu du serveur')
        .toEqual([]);

      sessionRestauree.next(buildAuthSession({ user: buildAuthUser({ roles: ['teacher'] }) }));
      sessionRestauree.complete();
      rendreLaPage();

      expect(decisions).toEqual([true]);
    });

    it('ne renvoie pas vers /contact quand la verification echoue hors refus, puis decide au nouvel essai', () => {
      const decisions = decisionsDe('teacher');

      rendreLaPage();
      sessionRestauree.error(new HttpErrorResponse({ status: 503 }));
      rendreLaPage();

      expect(decisions).withContext('une panne du serveur ne dit rien du role').toEqual([]);

      const nouvelEssai = new Subject<ReturnType<typeof buildAuthSession>>();
      port.refresh.and.returnValue(nouvelEssai);
      authState.restoreSession();
      nouvelEssai.next(buildAuthSession({ user: buildAuthUser({ roles: ['teacher'] }) }));
      nouvelEssai.complete();
      rendreLaPage();

      expect(decisions).toEqual([true]);
    });

    it('redirige quand l utilisateur restaure ne porte pas le role', () => {
      const decisions = decisionsDe('teacher');

      rendreLaPage();
      sessionRestauree.next(buildAuthSession({ user: buildAuthUser({ roles: ['user'] }) }));
      sessionRestauree.complete();
      rendreLaPage();

      expect(decisions.length).toBe(1);
      expect(String(decisions[0])).toBe('/contact?reason=access&app=teacher');
    });
  });
});
