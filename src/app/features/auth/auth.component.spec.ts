import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import type { AuthSession } from '../../core/models/auth.model';
import type { SignupFormState } from '../../core/models/signupForm.model';
import {
  buildAuthSession,
  buildAuthUser,
  buildLoginCredentials,
} from '../../../testing/factories/auth.factory';
import type { PageAuthMontee } from '../../../testing/page-auth';
import { formulaireSoumis, monterPageAuth } from '../../../testing/page-auth';
import { AuthComponent } from './auth.component';

const VALID_PASSWORD = buildLoginCredentials().password;
const MISMATCHED_PASSWORD = `${VALID_PASSWORD}-different`;

describe('AuthComponent', () => {
  let component: AuthComponent;
  let authService: PageAuthMontee<AuthComponent>['authService'];

  async function setupWithSeoKey(
    seoKey: string,
    queryParams: Record<string, string | null> = {},
  ): Promise<void> {
    const page = await monterPageAuth(AuthComponent, [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: { seoKey },
            queryParamMap: {
              get: (key: string) => queryParams[key] ?? null,
            },
          },
        },
      },
    ]);
    ({ component, authService } = page);
    page.fixture.detectChanges();
  }

  function remplirInscription(champs: Partial<SignupFormState> = {}): void {
    component.signupForm = {
      email: 'john@example.com',
      password: VALID_PASSWORD,
      verifPassword: VALID_PASSWORD,
      firstName: 'John',
      lastName: 'Doe',
      phone: '',
      ...champs,
    };
  }

  function accepterLInscription(): void {
    authService.register.and.returnValue(
      of({
        message: 'Inscription reussie. Un email de verification a ete envoye a votre adresse.',
      }),
    );
  }

  beforeEach(async () => {
    await setupWithSeoKey('login');
  });

  it('devrait afficher l onglet connexion par defaut sur /login', () => {
    expect(component.activeTab).toBe('log-in');
  });

  it('should call the auth service when sign up form is valid and passwords match', () => {
    const form = formulaireSoumis();
    remplirInscription({ phone: '  +33 6 12 34 56 78  ' });
    accepterLInscription();

    component.handleSignupSubmit(form);

    expect(authService.register).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: VALID_PASSWORD,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33 6 12 34 56 78',
    });
    expect(component.signupSuccessMessage).toContain('Inscription reussie');
  });

  it('devrait basculer vers l onglet login apres inscription reussie', () => {
    const form = formulaireSoumis();
    component.activeTab = 'sign-up';
    remplirInscription();
    accepterLInscription();

    component.handleSignupSubmit(form);

    expect(component.activeTab).toBe('log-in');
  });

  it('should not call auth service when passwords do not match', () => {
    const form = formulaireSoumis();
    remplirInscription({ verifPassword: MISMATCHED_PASSWORD });

    component.handleSignupSubmit(form);

    expect(authService.register).not.toHaveBeenCalled();
    expect(component.signupErrorMessage).toBeDefined();
  });

  it('should call auth service login when form is valid', () => {
    const form = formulaireSoumis();
    component.loginForm = {
      email: 'john@example.com',
      password: VALID_PASSWORD,
    };
    const session: AuthSession = buildAuthSession({
      accessToken: 'token',
      expiresIn: 3600,
      user: buildAuthUser({
        id: '1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: null,
        roles: [],
      }),
    });
    authService.login.and.returnValue(of(session));

    component.handleLoginSubmit(form);

    expect(authService.login).toHaveBeenCalledWith(component.loginForm);
    expect(component.loginSuccessMessage).toContain('Bienvenue');
  });

  const redirectionsApresLogin: readonly [string, string | null, string][] = [
    ['vers returnUrl apres login si present', '/profil', '/profil'],
    ['vers / si pas de returnUrl', null, '/'],
  ];

  for (const [cas, returnUrl, destination] of redirectionsApresLogin) {
    it(`devrait rediriger ${cas}`, () => {
      const navigateSpy = spyOn(TestBed.inject(Router), 'navigateByUrl');
      if (returnUrl !== null) {
        spyOn(TestBed.inject(ActivatedRoute).snapshot.queryParamMap, 'get').and.callFake(
          (key: string) => (key === 'returnUrl' ? returnUrl : null),
        );
      }
      component.loginForm = {
        email: 'john@example.com',
        password: VALID_PASSWORD,
      };
      authService.login.and.returnValue(
        of(buildAuthSession({ user: buildAuthUser({ firstName: 'John' }) })),
      );

      component.handleLoginSubmit(formulaireSoumis());

      expect(navigateSpy).toHaveBeenCalledWith(destination);
    });
  }

  describe('route /register', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await setupWithSeoKey('register');
    });

    it('devrait afficher l onglet inscription par defaut sur /register', () => {
      expect(component.activeTab).toBe('sign-up');
    });
  });

  describe('Google OAuth', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
    });

    it('appelle googleAuth et redirige vers returnUrl par defaut', async () => {
      await setupWithSeoKey('login');

      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, 'navigateByUrl');
      authService.googleAuth.and.returnValue(of(buildAuthSession()));

      (
        component as unknown as {
          onGoogleCredential: (
            response: { credential: string },
            context: 'sign-up' | 'log-in',
          ) => void;
        }
      ).onGoogleCredential({ credential: 'google-id-token' }, 'log-in');

      expect(authService.googleAuth).toHaveBeenCalledWith('google-id-token');
      expect(navigateSpy).toHaveBeenCalledWith('/');
    });
  });
});
