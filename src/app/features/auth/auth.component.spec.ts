import { HttpErrorResponse } from '@angular/common/http';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import type { AuthSession } from '../../core/models/auth.model';
import type { SignupFormState } from '../../core/models/signupForm.model';
import {
  decrireLaRegleDUnMotDePasseNeuf,
  erreursApresSaisie,
  MOTS_DE_PASSE,
  REGLE_SERVIE_PAR_LE_BACK as REGLE_SERVIE,
} from '../../../testing/champ-de-formulaire';
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
  let fixture: ComponentFixture<AuthComponent>;
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
    ({ fixture, component, authService } = page);
    fixture.detectChanges();
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
    ['vers / si returnUrl mene a une autre origine par une barre inverse', '/\\evil.example', '/'],
    [
      'vers / si returnUrl cache une autre origine derriere une tabulation',
      '/\t/evil.example',
      '/',
    ],
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

    const saisir = (id: string, valeur: string) => erreursApresSaisie(fixture, `#${id}`, valeur);

    it('exige 12 caractères au mot de passe, comme le back', async () => {
      expect(await saisir('reg-password', 'Abcdefgh1!x')).toEqual({
        minlength: { requiredLength: 12, actualLength: 11 },
      });
      expect(await saisir('reg-password', 'Abcdefgh1!xy')).toBeNull();
    });

    decrireLaRegleDUnMotDePasseNeuf(() => fixture, '#reg-password');

    it('plafonne le prénom et le nom à 50 caractères, comme le back', async () => {
      for (const id of ['reg-firstName', 'reg-lastName']) {
        expect(await saisir(id, 'a'.repeat(51))).toEqual({
          maxlength: { requiredLength: 50, actualLength: 51 },
        });
        expect(await saisir(id, 'a'.repeat(50))).toBeNull();
      }
    });

    it('plafonne le téléphone à 30 caractères, comme le back', async () => {
      expect(await saisir('reg-phone', '0'.repeat(31))).toEqual({
        maxlength: { requiredLength: 30, actualLength: 31 },
      });
      expect(await saisir('reg-phone', '0'.repeat(30))).toBeNull();
    });

    it('refuse à l inscription une adresse que le back refuse', async () => {
      expect(await saisir('reg-email', 'jean@gmail')).toEqual({ email: true });
      expect(await saisir('reg-email', 'jean@exemple.fr')).toBeNull();
    });

    it('affiche la règle servie par le back, jamais « Http failure response »', () => {
      authService.register.and.returnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              url: 'https://asilidesign.fr/api/v1/portfolio25/users',
              error: { status: 400, detail: [REGLE_SERVIE] },
            }),
        ),
      );
      remplirInscription();

      component.handleSignupSubmit(formulaireSoumis());

      expect(component.signupErrorMessage).toBe(REGLE_SERVIE);
    });

    it('affiche le message localisé quand le back ne répond pas', () => {
      authService.register.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 0, url: 'https://asilidesign.fr' })),
      );
      remplirInscription();

      component.handleSignupSubmit(formulaireSoumis());

      expect(component.signupErrorMessage).toBe('Une erreur est survenue. Veuillez réessayer.');
    });
  });

  describe('connexion', () => {
    const saisir = (id: string, valeur: string) => erreursApresSaisie(fixture, `#${id}`, valeur);

    it('refuse à la connexion une adresse que le back refuse', async () => {
      expect(await saisir('login-email', 'jean@gmail')).toEqual({ email: true });
      expect(await saisir('login-email', 'jean@exemple.fr')).toBeNull();
    });

    it('plafonne le mot de passe à 256 caractères, comme le back, sans exiger la règle d un compte neuf', async () => {
      expect(await saisir('login-password', MOTS_DE_PASSE.tropLong)).toEqual({
        maxlength: { requiredLength: 256, actualLength: 257 },
      });
      expect(await saisir('login-password', 'abc')).toBeNull();
    });
  });

  describe('Google OAuth', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
    });

    function connecterParGoogle(): void {
      (
        component as unknown as {
          onGoogleCredential: (
            response: { credential: string },
            context: 'sign-up' | 'log-in',
          ) => void;
        }
      ).onGoogleCredential({ credential: 'google-id-token' }, 'log-in');
    }

    it('appelle googleAuth et redirige vers returnUrl par defaut', async () => {
      await setupWithSeoKey('login');

      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, 'navigateByUrl');
      authService.googleAuth.and.returnValue(of(buildAuthSession()));

      connecterParGoogle();

      expect(authService.googleAuth).toHaveBeenCalledWith('google-id-token');
      expect(navigateSpy).toHaveBeenCalledWith('/');
    });

    it('affiche le message localisé quand Google échoue sans réponse du back', async () => {
      await setupWithSeoKey('login');
      authService.googleAuth.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 0, url: 'https://asilidesign.fr' })),
      );

      connecterParGoogle();

      expect(component.loginErrorMessage).toBe("Échec de l'authentification Google.");
    });
  });
});
