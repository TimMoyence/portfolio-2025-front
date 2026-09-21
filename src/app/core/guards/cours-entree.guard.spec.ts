import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, GuardResult, RouterStateSnapshot } from '@angular/router';
import { UrlTree } from '@angular/router';
import { AUTH_PORT } from '../ports/auth.port';
import { AuthStateService } from '../services/auth-state.service';
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from '../../../testing/factories/auth.factory';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { coursEntreeGuard } from './cours-entree.guard';

const SLUG = 'b2-01-traitement-information-chiffree';

describe('coursEntreeGuard', () => {
  let authState: AuthStateService;

  function decision(): GuardResult {
    return TestBed.runInInjectionContext(() =>
      coursEntreeGuard(
        { data: { coursSlug: SLUG } } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    ) as GuardResult;
  }

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

  afterEach(() => authState.clearSession());

  it('ouvre directement le pupitre pour un formateur', () => {
    authState.login(buildAuthSession({ user: buildAuthUser({ roles: ['teacher'] }) }));

    const result = decision();

    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe(`/cours/presenter/${SLUG}`);
  });

  it('ouvre directement le rattachement étudiant pour un étudiant', () => {
    authState.login(buildAuthSession({ user: buildAuthUser({ roles: ['student'] }) }));

    const result = decision();

    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe('/cours/rejoindre');
  });

  it('ouvre directement le rattachement étudiant pour un visiteur', () => {
    const result = decision();

    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe('/cours/rejoindre');
  });
});
