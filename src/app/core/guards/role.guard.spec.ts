import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot } from '@angular/router';
import { UrlTree } from '@angular/router';
import { AUTH_PORT } from '../ports/auth.port';
import { AuthStateService } from '../services/auth-state.service';
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from '../../../testing/factories/auth.factory';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let authState: AuthStateService;

  beforeEach(() => {
    setupTestBed({
      router: true,
      providers: [{ provide: AUTH_PORT, useValue: createAuthPortStub() }],
    });

    authState = TestBed.inject(AuthStateService);
  });

  it('devrait autoriser l acces si l utilisateur possede le role requis', () => {
    authState.login(buildAuthSession({ user: buildAuthUser({ roles: ['weather'] }) }));

    const guard = roleGuard('weather');
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as never),
    );

    expect(result).toBeTrue();
  });

  it('devrait rediriger vers /contact avec queryParams si l utilisateur ne possede pas le role', () => {
    authState.login(buildAuthSession({ user: buildAuthUser({ roles: ['sebastian'] }) }));

    const guard = roleGuard('weather');
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as never),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/contact?reason=access&app=weather');
  });

  it('devrait rediriger vers /contact avec queryParams si l utilisateur n est pas connecte', () => {
    const guard = roleGuard('weather');
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as never),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/contact?reason=access&app=weather');
  });
});
