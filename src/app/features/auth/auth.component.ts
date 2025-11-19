import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { LoginFormState } from '../../core/models/loginForm.model';
import { SignupFormState } from '../../core/models/signupForm.model';
import { SvgIconComponent } from '../../shared/components/svg-icon.component';

type AuthTab = 'sign-up' | 'log-in';
type SignupFormKey = keyof SignupFormState;
type LoginFormKey = keyof LoginFormState;

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgIconComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  activeTab: AuthTab = 'sign-up';
  isSignupSubmitted: boolean = false;
  isLoginSubmitted: boolean = false;
  signupForm: SignupFormState = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  };

  signupFields: {
    key: SignupFormKey;
    label: string;
    type: string;
    required: boolean;
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

  loginForm: LoginFormState = {
    email: '',
    password: '',
  };

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
    this.activeTab = tab;
  }

  isTabActive(tab: AuthTab): boolean {
    return this.activeTab === tab;
  }

  handleSignupSubmit(form: NgForm): void {
    this.isSignupSubmitted = true;

    if (form.invalid) {
      // On laisse Angular afficher les erreurs, on ne soumet pas
      return;
    }

    // Ici tu fais ton vrai traitement de signup
    console.log('Signup payload', this.signupForm);
  }

  handleLoginSubmit(form: NgForm): void {
    this.isLoginSubmitted = true;

    if (form.invalid) {
      // On laisse Angular afficher les erreurs, on ne soumet pas
      return;
    }

    // Ici tu fais ton vrai traitement de signup
    console.log('Login payload', this.loginForm);
  }

  handleGoogleAuth(context: AuthTab): void {
    console.log(`Google auth triggered for ${context}`);
  }
}
