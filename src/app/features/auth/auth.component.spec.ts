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
  telephoneBienFormeDeLongueur,
  texteDuBlocDuChamp,
} from '../../../testing/champ-de-formulaire';
import {
  buildAuthSession,
  buildAuthUser,
  buildLoginCredentials,
} from '../../../testing/factories/auth.factory';
import { fournirLaRoute } from '../../../testing/factories/route.factory';
import { refusDuBack } from '../../../testing/factories/probleme-http.factory';
import type { PageAuthMontee } from '../../../testing/page-auth';
import { formulaireSoumis, monterPageAuth } from '../../../testing/page-auth';
import { AuthComponent } from './auth.component';

const VALID_PASSWORD = buildLoginCredentials().password;
const MISMATCHED_PASSWORD = `${VALID_PASSWORD}-different`;

describe('AuthComponent', () => {
  let fixture: ComponentFixture<AuthComponent>;
  let component: AuthComponent;
  let authService: PageAuthMontee<AuthComponent>['authService'];

  async function setupWithSeoKey(seoKey: string): Promise<void> {
    const page = await monterPageAuth(AuthComponent, [
      fournirLaRoute({ donneesFigees: { seoKey } }),
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
  });

  it('dit le succès de l inscription par son propre texte, sur le panneau de connexion affiché ensuite', () => {
    component.activeTab = 'sign-up';
    remplirInscription();
    accepterLInscription();

    component.handleSignupSubmit(formulaireSoumis());
    fixture.detectChanges();

    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(component.activeTab).toBe('log-in');
    expect(texte).toContain(
      'Inscription réussie. Vérifiez votre e-mail pour activer votre compte.',
    );
    expect(texte).not.toContain('Un email de verification');
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

    it('juge le prénom et le nom rognés et comptés en caractères, comme le back', async () => {
      const sourire = String.fromCodePoint(0x1f600);
      for (const id of ['reg-firstName', 'reg-lastName']) {
        expect(await saisir(id, '   '))
          .withContext(id)
          .toEqual({ required: true });
        expect(await saisir(id, `  ${'a'.repeat(50)}  `))
          .withContext(id)
          .toBeNull();
        expect(await saisir(id, sourire.repeat(50)))
          .withContext(id)
          .toBeNull();
        expect(await saisir(id, sourire.repeat(51)))
          .withContext(id)
          .toEqual({ maxlength: { requiredLength: 50, actualLength: 51 } });
      }
    });

    it('refuse à l inscription un téléphone que le back refuse, et le dit sous le champ', async () => {
      expect(await saisir('reg-phone', '06 98 a0 32 82')).toEqual({ phone: true });
      expect(texteDuBlocDuChamp(fixture, '#reg-phone')).toContain(
        'Merci d’entrer un numéro de téléphone valide.',
      );
      expect(await saisir('reg-phone', '06 98 40 32 82')).toBeNull();
    });

    it('plafonne le téléphone à 30 caractères, comme le back', async () => {
      expect(await saisir('reg-phone', telephoneBienFormeDeLongueur(31))).toEqual({
        maxlength: { requiredLength: 30, actualLength: 31 },
      });
      expect(await saisir('reg-phone', telephoneBienFormeDeLongueur(30))).toBeNull();
    });

    it('refuse à l inscription une adresse que le back refuse', async () => {
      expect(await saisir('reg-email', 'jean@gmail')).toEqual({ email: true });
      expect(await saisir('reg-email', 'jean@exemple.fr')).toBeNull();
    });

    it('envoie l adresse, le prénom et le nom rognés, ceux que les champs ont jugés et que le back garde', async () => {
      const collee = `${String.fromCharCode(0xa0)}jean@exemple.fr  `;
      expect(await saisir('reg-email', collee)).toBeNull();
      remplirInscription({ email: collee, firstName: '  John ', lastName: ' Doe  ' });
      accepterLInscription();

      component.handleSignupSubmit(formulaireSoumis());

      expect(authService.register).toHaveBeenCalledWith(
        jasmine.objectContaining({ email: 'jean@exemple.fr', firstName: 'John', lastName: 'Doe' }),
      );
    });

    it('dit un refus de l inscription par un message localisé, jamais par le texte servi', () => {
      authService.register.and.returnValue(throwError(() => refusDuBack(400, [REGLE_SERVIE])));
      remplirInscription();

      component.handleSignupSubmit(formulaireSoumis());

      expect(component.signupErrorMessage).toBe(
        'Certaines informations ont été refusées : vérifiez les champs et réessayez.',
      );
      expect(component.isSignupLoading).toBeFalse();
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

    it('envoie l adresse rognée, celle que le champ a jugée, et le mot de passe tel quel', async () => {
      const collee = `${String.fromCharCode(0xa0)}jean@exemple.fr  `;
      expect(await saisir('login-email', collee)).toBeNull();
      component.loginForm = { email: collee, password: ` ${VALID_PASSWORD} ` };
      authService.login.and.returnValue(of(buildAuthSession()));

      component.handleLoginSubmit(formulaireSoumis());

      expect(authService.login).toHaveBeenCalledWith({
        email: 'jean@exemple.fr',
        password: ` ${VALID_PASSWORD} `,
      });
    });

    it('plafonne le mot de passe à 256 caractères, comme le back, sans exiger la règle d un compte neuf', async () => {
      expect(await saisir('login-password', MOTS_DE_PASSE.tropLong)).toEqual({
        maxlength: { requiredLength: 256, actualLength: 257 },
      });
      expect(await saisir('login-password', 'abc')).toBeNull();
    });

    for (const [statut, servi, attendu] of [
      [401, 'Invalid credentials', 'Adresse e-mail ou mot de passe incorrect.'],
      [400, 'email must be an email', 'Adresse e-mail ou mot de passe incorrect.'],
      [
        429,
        'ThrottlerException: Too Many Requests',
        'Trop de tentatives en peu de temps : réessayez plus tard.',
      ],
    ] as const) {
      it(`dit un refus ${statut} de la connexion par un message localisé, sous le formulaire`, () => {
        component.loginForm = { email: 'john@example.com', password: VALID_PASSWORD };
        authService.login.and.returnValue(throwError(() => refusDuBack(statut, servi)));

        component.handleLoginSubmit(formulaireSoumis());
        fixture.detectChanges();

        const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(texte).toContain(attendu);
        expect(texte).not.toContain(servi);
        expect(component.isLoginLoading).toBeFalse();
      });
    }
  });

  describe('Google OAuth', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
    });

    function connecterParGoogle(context: 'sign-up' | 'log-in' = 'log-in'): void {
      (
        component as unknown as {
          onGoogleCredential: (
            response: { credential: string },
            context: 'sign-up' | 'log-in',
          ) => void;
        }
      ).onGoogleCredential({ credential: 'google-id-token' }, context);
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

    it('dit un refus de Google par le message localisé, jamais par le texte servi', async () => {
      await setupWithSeoKey('login');
      authService.googleAuth.and.returnValue(
        throwError(() =>
          refusDuBack(401, 'Local account email not verified — refusing Google link'),
        ),
      );

      connecterParGoogle();

      expect(component.loginErrorMessage).toBe("Échec de l'authentification Google.");
    });

    async function echouerParGoogle(erreur: unknown, context: 'sign-up' | 'log-in'): Promise<void> {
      await setupWithSeoKey(context === 'sign-up' ? 'register' : 'login');
      authService.googleAuth.and.returnValue(throwError(() => erreur));
      connecterParGoogle(context);
    }

    it('L4-F22 · dit l échec Google dans l onglet d inscription quand il en part, sans toucher la connexion', async () => {
      await echouerParGoogle(
        new HttpErrorResponse({ status: 0, url: 'https://asilidesign.fr' }),
        'sign-up',
      );

      expect(component.signupErrorMessage).toBe("Échec de l'authentification Google.");
      expect(component.loginErrorMessage).toBeUndefined();
    });

    it('L4-F22 · dit la limite horaire d un échec Google avec l attente lue dans Retry-After', async () => {
      await echouerParGoogle(
        refusDuBack(429, 'ThrottlerException: Too Many Requests', { 'Retry-After': '120' }),
        'log-in',
      );

      expect(component.loginErrorMessage).toBe(
        'Trop de tentatives en peu de temps : réessayez dans 2 min.',
      );
    });
  });
});
