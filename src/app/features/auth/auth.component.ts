import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { RegisterUserPayload } from "../../core/models/auth.model";
import { LoginFormState } from "../../core/models/loginForm.model";
import { SignupFormState } from "../../core/models/signupForm.model";
import { AuthService } from "../../core/services/auth.service";
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
    SvgIconComponent,
    ContactCtaComponent,
    HeroSectionComponent,
  ],
  templateUrl: "./auth.component.html",
  styleUrl: "./auth.component.scss",
})
export class AuthComponent {
  private readonly authService = inject(AuthService);
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

    this.authService.register(payload).subscribe({
      next: (user) => {
        this.signupSuccessMessage = $localize`:auth.signup.success|Signup success message@@authSignupSuccess:Compte créé pour ${user.firstName} ${user.lastName}.`;
        this.resetSignupForm(form);
      },
      error: (error) => {
        this.signupErrorMessage = this.extractErrorMessage(error);
        this.isSignupLoading = false;
      },
      complete: () => {
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

    this.authService.login(this.loginForm).subscribe({
      next: (session) => {
        // TODO : Intégrer la gestion de session & token & integrer la redirection vers le bon endroit
        this.loginSuccessMessage = $localize`:auth.login.success|Login success message@@authLoginSuccess:Bienvenue ${session.user.firstName} !`;
      },
      error: (error) => {
        this.loginErrorMessage = this.extractErrorMessage(error);
        this.isLoginLoading = false;
      },
      complete: () => {
        this.isLoginLoading = false;
      },
    });
  }

  handleGoogleAuth(context: AuthTab): void {
    console.log(
      $localize`:auth.google.triggered|Console message for Google auth@@authGoogleTriggered:Google auth triggered for ${context}`,
    );
  }

  private resetSignupForm(form: NgForm): void {
    this.signupForm = { ...this.defaultSignupState };
    form.resetForm(this.signupForm);
    this.isSignupSubmitted = false;
  }

  private extractErrorMessage(error: unknown): string {
    if (
      typeof error === "object" &&
      error !== null &&
      "error" in error &&
      typeof (error as { error: { message?: string } }).error === "object"
    ) {
      const apiError = (error as { error: { message?: string } }).error;
      if (apiError?.message) {
        return apiError.message;
      }
    }

    return $localize`:auth.genericError|Generic error message@@authGenericError:Une erreur est survenue. Veuillez réessayer.`;
  }
}
