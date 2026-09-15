import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, GuardResult, RouterStateSnapshot } from '@angular/router';
import { UrlTree } from '@angular/router';
import { isObservable, Subject } from 'rxjs';
import type { AuthUser } from '../models/auth.model';
import { AUTH_PORT } from '../ports/auth.port';
import { AuthStateService } from '../services/auth-state.service';
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from '../../../testing/factories/auth.factory';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { roleGuard } from './role.guard';

const CLE_DU_JETON = 'portfolio_jwt';
const REDIRECTION_WEATHER = '/contact?reason=access&app=weather';

describe('roleGuard', () => {
  let authState: AuthStateService;
  let utilisateurRestaure: Subject<AuthUser>;
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
    localStorage.removeItem(CLE_DU_JETON);
    utilisateurRestaure = new Subject<AuthUser>();
    port = createAuthPortStub();
    port.me.and.returnValue(utilisateurRestaure);
    setupTestBed({
      router: true,
      providers: [{ provide: AUTH_PORT, useValue: port }],
    });

    authState = TestBed.inject(AuthStateService);
  });

  afterEach(() => {
    authState.clearSession();
    localStorage.removeItem(CLE_DU_JETON);
  });

  it('devrait autoriser l acces si l utilisateur possede le role requis', () => {
    authState.login(buildAuthSession({ user: buildAuthUser({ roles: ['weather'] }) }));

    expect(decisionsDe('weather')).toEqual([true]);
  });

  it('devrait rediriger vers /contact avec queryParams si l utilisateur ne possede pas le role', () => {
    authState.login(buildAuthSession({ user: buildAuthUser({ roles: ['sebastian'] }) }));

    const [decision] = decisionsDe('weather');

    expect(decision).toBeInstanceOf(UrlTree);
    expect(String(decision)).toBe(REDIRECTION_WEATHER);
  });

  it('devrait rediriger vers /contact une fois la session resolue sans jeton', () => {
    const decisions = decisionsDe('weather');

    rendreLaPage();
    rendreLaPage();

    expect(decisions.length).toBe(1);
    expect(decisions[0]).toBeInstanceOf(UrlTree);
    expect(String(decisions[0])).toBe(REDIRECTION_WEATHER);
  });

  describe('au chargement d une page avec un jeton enregistre', () => {
    beforeEach(() => {
      localStorage.setItem(CLE_DU_JETON, 'jwt-restaure');
    });

    it('attend l utilisateur restaure et autorise le role qu il porte', () => {
      const decisions = decisionsDe('teacher');

      rendreLaPage();
      rendreLaPage();

      expect(authState.token()).toBe('jwt-restaure');
      expect(authState.isInitialized()).toBeTrue();
      expect(decisions)
        .withContext('aucune decision tant que l utilisateur n est pas revenu du serveur')
        .toEqual([]);

      utilisateurRestaure.next(buildAuthUser({ roles: ['teacher'] }));
      utilisateurRestaure.complete();
      rendreLaPage();

      expect(decisions).toEqual([true]);
    });

    it('ne renvoie pas vers /contact quand la verification echoue hors refus, puis decide au nouvel essai', () => {
      const decisions = decisionsDe('teacher');

      rendreLaPage();
      utilisateurRestaure.error(new HttpErrorResponse({ status: 503 }));
      rendreLaPage();

      expect(decisions).withContext('une panne du serveur ne dit rien du role').toEqual([]);
      expect(authState.token()).toBe('jwt-restaure');

      const nouvelEssai = new Subject<AuthUser>();
      port.me.and.returnValue(nouvelEssai);
      authState.restoreSession();
      nouvelEssai.next(buildAuthUser({ roles: ['teacher'] }));
      nouvelEssai.complete();
      rendreLaPage();

      expect(decisions).toEqual([true]);
    });

    it('redirige quand l utilisateur restaure ne porte pas le role', () => {
      const decisions = decisionsDe('teacher');

      rendreLaPage();
      utilisateurRestaure.next(buildAuthUser({ roles: ['weather'] }));
      utilisateurRestaure.complete();
      rendreLaPage();

      expect(decisions.length).toBe(1);
      expect(String(decisions[0])).toBe('/contact?reason=access&app=teacher');
    });
  });
});
