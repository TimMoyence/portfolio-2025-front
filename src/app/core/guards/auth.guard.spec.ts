import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot } from '@angular/router';
import { UrlTree } from '@angular/router';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import type { AuthStateService } from '../services/auth-state.service';
import { etatAuth } from '../../../testing/etat-auth';
import { buildAuthSession, createAuthPortStub } from '../../../testing/factories/auth.factory';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  describe('chemin synchrone (SSR — session resolue)', () => {
    let authState: AuthStateService;

    beforeEach(() => {
      authState = etatAuth('server');
    });

    it('devrait autoriser l acces si l utilisateur est connecte', () => {
      authState.login(buildAuthSession());

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, {} as never),
      );

      expect(result).toBeTrue();
    });

    it('devrait rediriger vers /login avec returnUrl si l utilisateur n est pas connecte', () => {
      const state = {
        url: '/profil',
      } as import('@angular/router').RouterStateSnapshot;
      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, state),
      );

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

      const result = TestBed.runInInjectionContext(() =>
        authGuard(
          {} as ActivatedRouteSnapshot,
          { url: '/profil' } as import('@angular/router').RouterStateSnapshot,
        ),
      );

      expect(result).toBeInstanceOf(Observable);
    });

    it('devrait autoriser l acces si la session est connectee', () => {
      authState.login(buildAuthSession());

      const result = TestBed.runInInjectionContext(() =>
        authGuard(
          {} as ActivatedRouteSnapshot,
          { url: '/profil' } as import('@angular/router').RouterStateSnapshot,
        ),
      );

      expect(result).toBeTrue();
    });

    it('devrait rediriger via Observable si l utilisateur n est pas connecte apres initialisation', async () => {
      const result = TestBed.runInInjectionContext(() =>
        authGuard(
          {} as ActivatedRouteSnapshot,
          { url: '/profil' } as import('@angular/router').RouterStateSnapshot,
        ),
      );

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
