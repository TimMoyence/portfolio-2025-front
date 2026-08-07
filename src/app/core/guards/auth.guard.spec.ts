import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot } from '@angular/router';
import { UrlTree } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { AUTH_PORT } from '../ports/auth.port';
import { AuthStateService } from '../services/auth-state.service';
import { buildAuthSession, createAuthPortStub } from '../../../testing/factories/auth.factory';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  describe('chemin synchrone (SSR — isInitialized = true)', () => {
    let authState: AuthStateService;

    beforeEach(() => {
      setupTestBed({
        router: true,
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: AUTH_PORT, useValue: createAuthPortStub() },
        ],
      });

      authState = TestBed.inject(AuthStateService);
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

  describe('chemin asynchrone (navigateur — isInitialized = false)', () => {
    let authState: AuthStateService;

    beforeEach(() => {
      setupTestBed({
        router: true,
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: AUTH_PORT, useValue: createAuthPortStub() },
        ],
      });

      authState = TestBed.inject(AuthStateService);
    });

    it('devrait retourner un Observable quand isInitialized est false', () => {
      expect(authState.isInitialized()).toBeFalse();

      const result = TestBed.runInInjectionContext(() =>
        authGuard(
          {} as ActivatedRouteSnapshot,
          { url: '/profil' } as import('@angular/router').RouterStateSnapshot,
        ),
      );

      expect(result).toBeInstanceOf(Observable);
    });

    it('devrait autoriser l acces via Observable si l utilisateur est connecte apres initialisation', async () => {
      authState.login(buildAuthSession());

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
      expect(value).toBeTrue();
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
