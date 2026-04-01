import { CommonModule, isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  PLATFORM_ID,
  ViewChild,
} from "@angular/core";
import type { NgForm } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import type { RegisterUserPayload } from "../../core/models/auth.model";
import type { LoginFormState } from "../../core/models/loginForm.model";
import type { SignupFormState } from "../../core/models/signupForm.model";
import { Router, RouterModule } from "@angular/router";
import { APP_CONFIG } from "../../core/config/app-config.token";
import { AuthStateService } from "../../core/services/auth-state.service";
import { AuthService } from "../../core/services/auth.service";
import { loadGoogleGis } from "../../core/utils/google-gis";
import { handleFormSubmit } from "../../shared/utils/form-submit.utils";
import { ContactCtaComponent } from "../../shared/components/cta-contact/cta-contact.component";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";
import { SvgIconComponent } from "../../shared/components/svg-icon.component";

type AuthTab = "sign-up" | "log-in";
type SignupFormKey = keyof SignupFormState;
type LoginFormKey = keyof LoginFormState;

@Component({
  selector: "app-auth",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SvgIconComponent,
    ContactCtaComponent,
    HeroSectionComponent,
  ],
  templateUrl: "./auth.component.html",
  styleUrl: "./auth.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  private readonly authService = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild("googleButtonContainer", { static: false })
  googleButtonContainer?: ElementRef<HTMLDivElement>;
  private readonly appConfig = inject(APP_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly defaultSignupState: SignupFormState = {
    email: "",
    password: "",
    verifPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  };

  private readonly defaultLoginState: LoginFormState = {
    email: "",
    password: "",
  };

  activeTab: AuthTab = "sign-up";
  showPassword: boolean = false;
  isSignupSubmitted: boolean = false;
  isLoginSubmitted: boolean = false;
  isSignupLoading: boolean = false;
  isLoginLoading: boolean = false;
  signupErrorMessage?: string;
  signupSuccessMessage?: string;
  loginErrorMessage?: string;
  loginSuccessMessage?: string;
  signupForm: SignupFormState = { ...this.defaultSignupState };

  readonly hero = {
    label: $localize`:auth.hero.label@@authHeroLabel:Accès`,
    title: $localize`:auth.hero.title@@authHeroTitle:Connexion ou inscription`,
    description: $localize`:auth.hero.description@@authHeroDescription:Rejoignez votre espace sécurisé pour suivre vos projets et vos échanges.`,
  };

  readonly contactSection = {
    leadParagraphs: [
      $localize`:home.contact.lead.1|Home contact lead paragraph@@homeContactLead1:Vous avez un besoin, une contrainte ou une idée à clarifier ?`,
      $localize`:home.contact.lead.2|Home contact lead paragraph@@homeContactLead2:Un premier échange permet de comprendre votre contexte et de définir la suite la plus pertinente.`,
    ],
  };

  signupFields: {
    key: SignupFormKey;
    label: string;
    type: string;
    required: boolean;
    icon?: string;
  }[] = [
    {
      key: "firstName",
      label: $localize`:auth.signup.field.firstName|Signup field label@@authSignupFieldFirstName:Prénom`,
      type: "text",
      required: true,
    },
    {
      key: "lastName",
      label: $localize`:auth.signup.field.lastName|Signup field label@@authSignupFieldLastName:Nom`,
      type: "text",
      required: true,
    },
    {
      key: "email",
      label: $localize`:auth.signup.field.email|Signup field label@@authSignupFieldEmail:Email`,
      type: "email",
      required: true,
    },
    {
      key: "password",
      label: $localize`:auth.signup.field.password|Signup field label@@authSignupFieldPassword:Mot de passe`,
      type: "password",
      required: true,
    },
    {
      key: "verifPassword",
      label: $localize`:auth.signup.field.passwordConfirm|Signup field label@@authSignupFieldPasswordConfirm:Verification de mot de passe`,
      type: "password",
      required: true,
    },
    {
      key: "phone",
      label: $localize`:auth.signup.field.phone|Signup field label@@authSignupFieldPhone:Téléphone`,
      type: "tel",
      required: false,
    },
  ];

  loginForm: LoginFormState = { ...this.defaultLoginState };

  loginFields: {
    key: LoginFormKey;
    label: string;
    type: string;
    required: boolean;
  }[] = [
    {
      key: "email",
      label: $localize`:auth.login.field.email|Login field label@@authLoginFieldEmail:Email`,
      type: "email",
      required: true,
    },
    {
      key: "password",
      label: $localize`:auth.login.field.password|Login field label@@authLoginFieldPassword:Mot de passe`,
      type: "password",
      required: true,
    },
  ];

  selectTab(tab: AuthTab): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
  }

  isTabActive(tab: AuthTab): boolean {
    return this.activeTab === tab;
  }

  handleSignupSubmit(form: NgForm): void {
    this.isSignupSubmitted = true;
    this.signupErrorMessage = undefined;
    this.signupSuccessMessage = undefined;

    if (form.invalid) return;

    if (this.signupForm.password !== this.signupForm.verifPassword) {
      this.signupErrorMessage = $localize`:auth.signup.error.passwordMismatch|Signup error message@@authSignupErrorPasswordMismatch:Les mots de passe ne correspondent pas.`;
      return;
    }

    const payload: RegisterUserPayload = {
      email: this.signupForm.email,
      password: this.signupForm.password,
      firstName: this.signupForm.firstName,
      lastName: this.signupForm.lastName,
      phone: this.signupForm.phone?.trim() || null,
    };

    this.isSignupLoading = true;

    handleFormSubmit(this.authService.register(payload), this.cdr, {
      fallbackError: $localize`:auth.genericError|Generic error message@@authGenericError:Une erreur est survenue. Veuillez réessayer.`,
      onSuccess: (user) => {
        this.signupSuccessMessage = $localize`:auth.signup.success|Signup success message@@authSignupSuccess:Compte créé pour ${user.firstName} ${user.lastName}.`;
        this.resetSignupForm(form);
      },
      onError: (message) => {
        this.signupErrorMessage = message;
        this.isSignupLoading = false;
      },
      onComplete: () => {
        this.isSignupLoading = false;
      },
    });
  }

  handleLoginSubmit(form: NgForm): void {
    this.isLoginSubmitted = true;
    this.loginErrorMessage = undefined;
    this.loginSuccessMessage = undefined;

    if (form.invalid) return;

    this.isLoginLoading = true;

    handleFormSubmit(this.authService.login(this.loginForm), this.cdr, {
      fallbackError: $localize`:auth.genericError|Generic error message@@authGenericError:Une erreur est survenue. Veuillez réessayer.`,
      onSuccess: (session) => {
        this.authState.login(session);
        this.loginSuccessMessage = $localize`:auth.login.success|Login success message@@authLoginSuccess:Bienvenue ${session.user.firstName} !`;
        void this.router.navigate(["/"]);
      },
      onError: (message) => {
        this.loginErrorMessage = message;
        this.isLoginLoading = false;
      },
      onComplete: () => {
        this.isLoginLoading = false;
      },
    });
  }

  /** Lance le flux d'authentification Google via GIS One Tap. */
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
      context: context === "sign-up" ? "signup" : "signin",
    });

    google.accounts.id.prompt();
  }

  /** Traite la reponse du jeton Google apres authentification. */
  private onGoogleCredential(
    response: google.accounts.id.CredentialResponse,
    context: AuthTab,
  ): void {
    this.authService.googleAuth(response.credential).subscribe({
      next: (session) => {
        this.authState.login(session);
        void this.router.navigate(["/"]);
      },
      error: (err) => {
        const message =
          err?.error?.message ??
          $localize`:auth.google.error@@authGoogleError:Échec de l'authentification Google.`;
        this.setGoogleError(context, message);
        this.cdr.markForCheck();
      },
    });
  }

  /** Affiche un message d'erreur Google dans le contexte (inscription ou connexion). */
  private setGoogleError(context: AuthTab, message: string): void {
    if (context === "sign-up") {
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
}
