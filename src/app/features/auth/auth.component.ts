import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RegisterUserPayload } from '../../core/models/auth.model';
import { LoginFormState } from '../../core/models/loginForm.model';
import { SignupFormState } from '../../core/models/signupForm.model';
import { AuthService } from '../../core/services/auth.service';
import { ContactComponent } from '../../shared/components/contact/contact.component';
import { SvgIconComponent } from '../../shared/components/svg-icon.component';

type AuthTab = 'sign-up' | 'log-in';
type SignupFormKey = keyof SignupFormState;
type LoginFormKey = keyof LoginFormState;

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgIconComponent, ContactComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  private readonly authService = inject(AuthService);
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

  activeTab: AuthTab = 'sign-up';
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

  signupFields: {
    key: SignupFormKey;
    label: string;
    type: string;
    required: boolean;
    icon?: string;
  }[] = [
    { key: 'firstName', label: 'Prénom', type: 'text', required: true },
    { key: 'lastName', label: 'Nom', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    {
      key: 'password',
      label: 'Mot de passe',
      type: 'password',
      required: true,
    },
    {
      key: 'verifPassword',
      label: 'Verification de mot de passe',
      type: 'password',
      required: true,
    },
    { key: 'phone', label: 'Téléphone', type: 'tel', required: false },
  ];

  loginForm: LoginFormState = { ...this.defaultLoginState };

  loginFields: {
    key: LoginFormKey;
    label: string;
    type: string;
    required: boolean;
  }[] = [
    { key: 'email', label: 'Email', type: 'email', required: true },
    {
      key: 'password',
      label: 'Mot de passe',
      type: 'password',
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
      this.signupErrorMessage = 'Les mots de passe ne correspondent pas.';
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
        this.signupSuccessMessage = `Compte créé pour ${user.firstName} ${user.lastName}.`;
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
        this.loginSuccessMessage = `Bienvenue ${session.user.firstName} !`;
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
    console.log(`Google auth triggered for ${context}`);
  }

  private resetSignupForm(form: NgForm): void {
    this.signupForm = { ...this.defaultSignupState };
    form.resetForm(this.signupForm);
    this.isSignupSubmitted = false;
  }

  private extractErrorMessage(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error: { message?: string } }).error === 'object'
    ) {
      const apiError = (error as { error: { message?: string } }).error;
      if (apiError?.message) {
        return apiError.message;
      }
    }

    return 'Une erreur est survenue. Veuillez réessayer.';
  }
}
