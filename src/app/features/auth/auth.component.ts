import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import type { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import type { AuthSession, RegisterUserPayload } from '../../core/models/auth.model';
import type { LoginFormState } from '../../core/models/loginForm.model';
import type { SignupFormState } from '../../core/models/signupForm.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { APP_CONFIG } from '../../core/config/app-config.token';
import { estCheminInterne } from '../../core/seo/chemins';
import { AuthStateService } from '../../core/services/auth-state.service';
import type { AuthPort } from '../../core/ports/auth.port';
import { AUTH_PORT } from '../../core/ports/auth.port';
import { loadGoogleGis } from '../../core/utils/google-gis';
import {
  handleFormSubmit,
  INFORMATIONS_REFUSEES,
  messageDuRefus,
} from '../../shared/utils/form-submit.utils';
import type { Bornes } from '../../shared/utils/regles-de-saisie';
import {
  BORNES_D_UN_MOT_DE_PASSE_SAISI,
  BORNES_D_UN_NOM,
  BORNES_D_UN_TELEPHONE,
  REGLE_D_UN_MOT_DE_PASSE,
} from '../../shared/utils/regles-de-saisie';
import { telephoneFacultatif } from '../../shared/utils/telephone.utils';
import { SvgIconComponent } from '../../shared/components/svg-icon.component';
import { BornesDeSaisieDirective } from '../../shared/directives/bornes-de-saisie.directive';
import type { FormatDeContact } from '../../shared/directives/format-de-contact.directive';
import { FormatDeContactDirective } from '../../shared/directives/format-de-contact.directive';
import { MotDePasseNeufDirective } from '../../shared/directives/mot-de-passe-neuf.directive';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { AuthShellComponent } from '../../shared/components/auth-shell/auth-shell.component';
import { FieldErrorsComponent } from '../../shared/components/field-errors/field-errors.component';

const IDENTIFIANTS_REFUSES = $localize`:@@authLoginErreurIdentifiants:Adresse e-mail ou mot de passe incorrect.`;

type AuthTab = 'sign-up' | 'log-in';
type SignupFormKey = keyof SignupFormState;
type LoginFormKey = keyof LoginFormState;

interface ChampAuth {
  key: SignupFormKey;
  label: string;
  type: string;
  required: boolean;
  bornes?: Bornes;
  format?: FormatDeContact;
  motDePasseNeuf?: true;
  indication?: string;
}

interface PanneauAuth {
  champs: readonly ChampAuth[];
  valeurs: Partial<Record<SignupFormKey, string | null>>;
  prefixe: string;
  titreGoogle: string;
  soumis: boolean;
  enCours: boolean;
  erreur?: string;
  succes?: string;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SvgIconComponent,
    RevealOnScrollDirective,
    AuthShellComponent,
    FieldErrorsComponent,
    BornesDeSaisieDirective,
    FormatDeContactDirective,
    MotDePasseNeufDirective,
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  private readonly authService: AuthPort = inject(AUTH_PORT);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('googleButtonContainer', { static: false })
  googleButtonContainer?: ElementRef<HTMLDivElement>;
  private readonly appConfig = inject(APP_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly defaultSignupState: SignupFormState = {
    email: '',
    password: '',
    verifPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  };

  private readonly defaultLoginState: LoginFormState = {
    email: '',
    password: '',
  };

  activeTab: AuthTab = this.resolveInitialTab();
  showPassword: boolean = false;
  protected readonly showPasswordLabel = $localize`:@@authShowPassword:Afficher le mot de passe`;
  protected readonly hidePasswordLabel = $localize`:@@authHidePassword:Masquer le mot de passe`;
  isSignupSubmitted: boolean = false;
  isLoginSubmitted: boolean = false;
  isSignupLoading: boolean = false;
  isLoginLoading: boolean = false;
  signupErrorMessage?: string;
  loginErrorMessage?: string;
  loginSuccessMessage?: string;
  signupForm: SignupFormState = { ...this.defaultSignupState };

  signupFields: readonly ChampAuth[] = [
    {
      key: 'firstName',
      label: $localize`:auth.signup.field.firstName|Signup field label@@authSignupFieldFirstName:Prénom`,
      type: 'text',
      required: true,
      bornes: BORNES_D_UN_NOM,
    },
    {
      key: 'lastName',
      label: $localize`:auth.signup.field.lastName|Signup field label@@authSignupFieldLastName:Nom`,
      type: 'text',
      required: true,
      bornes: BORNES_D_UN_NOM,
    },
    {
      key: 'email',
      label: $localize`:auth.signup.field.email|Signup field label@@authSignupFieldEmail:Email`,
      type: 'email',
      required: true,
      format: 'email',
    },
    {
      key: 'password',
      label: $localize`:auth.signup.field.password|Signup field label@@authSignupFieldPassword:Mot de passe`,
      type: 'password',
      required: true,
      motDePasseNeuf: true,
      indication: REGLE_D_UN_MOT_DE_PASSE,
    },
    {
      key: 'verifPassword',
      label: $localize`:auth.signup.field.passwordConfirm|Signup field label@@authSignupFieldPasswordConfirm:Vérification du mot de passe`,
      type: 'password',
      required: true,
    },
    {
      key: 'phone',
      label: $localize`:auth.signup.field.phone|Signup field label@@authSignupFieldPhone:Téléphone`,
      type: 'tel',
      required: false,
      bornes: BORNES_D_UN_TELEPHONE,
      format: 'telephone',
    },
  ];

  loginForm: LoginFormState = { ...this.defaultLoginState };

  loginFields: readonly (ChampAuth & { key: LoginFormKey })[] = [
    {
      key: 'email',
      label: $localize`:auth.login.field.email|Login field label@@authLoginFieldEmail:Email`,
      type: 'email',
      required: true,
      format: 'email',
    },
    {
      key: 'password',
      label: $localize`:auth.login.field.password|Login field label@@authLoginFieldPassword:Mot de passe`,
      type: 'password',
      required: true,
      bornes: BORNES_D_UN_MOT_DE_PASSE_SAISI,
    },
  ];

  selectTab(tab: AuthTab): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
  }

  isTabActive(tab: AuthTab): boolean {
    return this.activeTab === tab;
  }

  protected panneauDe(onglet: AuthTab): PanneauAuth {
    return onglet === 'log-in'
      ? {
          champs: this.loginFields,
          valeurs: this.loginForm,
          prefixe: 'login-',
          titreGoogle: $localize`Connectez-vous avec Google`,
          soumis: this.isLoginSubmitted,
          enCours: this.isLoginLoading,
          erreur: this.loginErrorMessage,
          succes: this.loginSuccessMessage,
        }
      : {
          champs: this.signupFields,
          valeurs: this.signupForm,
          prefixe: 'reg-',
          titreGoogle: $localize`Inscrivez-vous avec Google`,
          soumis: this.isSignupSubmitted,
          enCours: this.isSignupLoading,
          erreur: this.signupErrorMessage,
        };
  }

  protected soumettre(onglet: AuthTab, form: NgForm): void {
    if (onglet === 'log-in') {
      this.handleLoginSubmit(form);
    } else {
      this.handleSignupSubmit(form);
    }
  }

  handleSignupSubmit(form: NgForm): void {
    this.isSignupSubmitted = true;
    this.signupErrorMessage = undefined;

    if (form.invalid) return;

    if (this.signupForm.password !== this.signupForm.verifPassword) {
      this.signupErrorMessage = $localize`:auth.signup.error.passwordMismatch|Signup error message@@authSignupErrorPasswordMismatch:Les mots de passe ne correspondent pas.`;
      return;
    }

    const payload: RegisterUserPayload = {
      email: this.signupForm.email,
      password: this.signupForm.password,
      firstName: this.signupForm.firstName.trim(),
      lastName: this.signupForm.lastName.trim(),
      phone: telephoneFacultatif(this.signupForm.phone),
    };

    this.isSignupLoading = true;

    handleFormSubmit(this.authService.register(payload), this.cdr, {
      fallbackError: $localize`:auth.genericError|Generic error message@@authGenericError:Une erreur est survenue. Veuillez réessayer.`,
      refus: { 400: INFORMATIONS_REFUSEES },
      onSuccess: () => {
        this.loginSuccessMessage = $localize`:auth.signup.success|Signup success message@@authSignupSuccess:Inscription réussie. Vérifiez votre e-mail pour activer votre compte.`;
        this.resetSignupForm(form);
        this.activeTab = 'log-in';
      },
      onError: (message) => {
        this.signupErrorMessage = message;
      },
      finalement: () => {
        this.isSignupLoading = false;
      },
    });
  }

  private sanitizeReturnUrl(raw: string | null | undefined): string {
    if (!raw) return '/';
    const trimmed = raw.trim();
    return estCheminInterne(trimmed) ? trimmed : '/';
  }

  private ouvrirLaSession(session: AuthSession): void {
    this.authState.login(session);
    const returnUrl = this.sanitizeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    void this.router.navigateByUrl(returnUrl);
  }

  handleLoginSubmit(form: NgForm): void {
    this.isLoginSubmitted = true;
    this.loginErrorMessage = undefined;
    this.loginSuccessMessage = undefined;

    if (form.invalid) return;

    this.isLoginLoading = true;

    handleFormSubmit(this.authService.login(this.loginForm), this.cdr, {
      fallbackError: $localize`:auth.genericError|Generic error message@@authGenericError:Une erreur est survenue. Veuillez réessayer.`,
      refus: { 400: IDENTIFIANTS_REFUSES, 401: IDENTIFIANTS_REFUSES },
      onSuccess: (session) => {
        this.loginSuccessMessage = $localize`:auth.login.success|Login success message@@authLoginSuccess:Bienvenue ${session.user.firstName} !`;
        this.ouvrirLaSession(session);
      },
      onError: (message) => {
        this.loginErrorMessage = message;
      },
      finalement: () => {
        this.isLoginLoading = false;
      },
    });
  }

  async handleGoogleAuth(context: AuthTab): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const clientId = this.appConfig.googleClientId;
    if (!clientId) {
      this.setGoogleError(
        context,
        $localize`:auth.google.notConfigured@@authGoogleNotConfigured:L'authentification Google n'est pas configurée.`,
      );
      return;
    }

    try {
      await loadGoogleGis();
    } catch {
      this.setGoogleError(
        context,
        $localize`:auth.google.loadError@@authGoogleLoadError:Impossible de charger Google Sign-In.`,
      );
      return;
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => this.onGoogleCredential(response, context),
      context: context === 'sign-up' ? 'signup' : 'signin',
    });

    google.accounts.id.prompt();
  }

  private onGoogleCredential(
    response: google.accounts.id.CredentialResponse,
    context: AuthTab,
  ): void {
    this.authService.googleAuth(response.credential).subscribe({
      next: (session) => this.ouvrirLaSession(session),
      error: (err: unknown) => {
        this.setGoogleError(
          context,
          messageDuRefus(
            err,
            {},
            $localize`:auth.google.error@@authGoogleError:Échec de l'authentification Google.`,
          ),
        );
      },
    });
  }

  private setGoogleError(context: AuthTab, message: string): void {
    if (context === 'sign-up') {
      this.signupErrorMessage = message;
    } else {
      this.loginErrorMessage = message;
    }
    this.cdr.markForCheck();
  }

  private resetSignupForm(form: NgForm): void {
    this.signupForm = { ...this.defaultSignupState };
    form.resetForm(this.signupForm);
    this.isSignupSubmitted = false;
  }

  private resolveInitialTab(): AuthTab {
    const seoKey = this.route.snapshot.data['seoKey'];
    return seoKey === 'register' ? 'sign-up' : 'log-in';
  }
}
