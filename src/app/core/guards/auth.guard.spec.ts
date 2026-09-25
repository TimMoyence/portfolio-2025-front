import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UrlTree } from '@angular/router';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import type { AuthStateService } from '../services/auth-state.service';
import { etatAuth } from '../../../testing/etat-auth';
import { buildAuthSession, createAuthPortStub } from '../../../testing/factories/auth.factory';
import { authGuard } from './auth.guard';

function garderLeProfil(): ReturnType<typeof authGuard> {
  return TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, { url: '/profil' } as RouterStateSnapshot),
  );
}

function attendreLAccesUneFoisConnecte(authState: AuthStateService): void {
  authState.login(buildAuthSession());

  expect(garderLeProfil()).toBeTrue();
}

describe('authGuard', () => {
  describe('chemin synchrone (SSR — session resolue)', () => {
    let authState: AuthStateService;

    beforeEach(() => {
      authState = etatAuth('server');
    });

    it('devrait autoriser l acces si l utilisateur est connecte', () => {
      attendreLAccesUneFoisConnecte(authState);
    });

    it('devrait rediriger vers /login avec returnUrl si l utilisateur n est pas connecte', () => {
      const result = garderLeProfil();

      expect(result).toBeInstanceOf(UrlTree);
      const tree = result as UrlTree;
      expect(tree.toString()).toBe('/login?returnUrl=%2Fprofil');
    });
  });

  describe('chemin asynchrone (navigateur — session non resolue)', () => {
    let authState: AuthStateService;

    beforeEach(() => {
      const port = createAuthPortStub();
      port.refresh.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
      authState = etatAuth('browser', port);
    });

    it('devrait retourner un Observable quand la session n est pas resolue', () => {
      expect(authState.isSessionResolved()).toBeFalse();

      expect(garderLeProfil()).toBeInstanceOf(Observable);
    });

    it('devrait autoriser l acces si la session est connectee', () => {
      attendreLAccesUneFoisConnecte(authState);
    });

    it('devrait rediriger via Observable si l utilisateur n est pas connecte apres initialisation', async () => {
      const result = garderLeProfil();

      expect(result).toBeInstanceOf(Observable);

      (
        authState as unknown as {
          _isInitialized: { set: (v: boolean) => void };
        }
      )._isInitialized.set(true);

      const value = await firstValueFrom(result as Observable<boolean | UrlTree>);
      expect(value).toBeInstanceOf(UrlTree);
      expect((value as UrlTree).toString()).toBe('/login?returnUrl=%2Fprofil');
    });
  });
});
