import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UrlTree } from '@angular/router';
import type { AuthStateService } from '../services/auth-state.service';
import { etatAuth } from '../../../testing/etat-auth';
import { buildAuthSession, buildAuthUser } from '../../../testing/factories/auth.factory';
import { coursEntreeGuard } from './cours-entree.guard';

const SLUG = 'b2-01-traitement-information-chiffree';

describe('coursEntreeGuard', () => {
  let authState: AuthStateService;

  function connecter(role: string): void {
    authState.login(buildAuthSession({ user: buildAuthUser({ roles: [role] }) }));
  }

  function attendreLaRedirectionVers(url: string): void {
    const result = TestBed.runInInjectionContext(() =>
      coursEntreeGuard(
        { data: { coursSlug: SLUG } } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe(url);
  }

  beforeEach(() => {
    authState = etatAuth('server');
  });

  afterEach(() => authState.clearSession());

  it('ouvre directement le pupitre pour un formateur', () => {
    connecter('teacher');

    attendreLaRedirectionVers(`/cours/presenter/${SLUG}`);
  });

  it('ouvre directement le rattachement étudiant pour un étudiant', () => {
    connecter('student');

    attendreLaRedirectionVers(`/cours/rejoindre?cours=${SLUG}`);
  });

  it('R3 · F03 · envoie le visiteur non connecté au rattachement étudiant, en gardant le cours visé', () => {
    attendreLaRedirectionVers(`/cours/rejoindre?cours=${SLUG}`);
  });
});
