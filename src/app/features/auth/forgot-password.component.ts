import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import type { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import type { AuthPort } from '../../core/ports/auth.port';
import { AUTH_PORT } from '../../core/ports/auth.port';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { AuthShellComponent } from '../../shared/components/auth-shell/auth-shell.component';
import { AuthSuccessComponent } from '../../shared/components/auth-success/auth-success.component';
import { handleFormSubmit } from '../../shared/utils/form-submit.utils';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RevealOnScrollDirective,
    AuthShellComponent,
    AuthSuccessComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly authService: AuthPort = inject(AUTH_PORT);
  private readonly cdr = inject(ChangeDetectorRef);

  email = '';
  submitted = false;
  isLoading = false;
  successMessage?: string;
  errorMessage?: string;

  submit(form: NgForm): void {
    this.submitted = true;
    this.successMessage = undefined;
    this.errorMessage = undefined;

    if (form.invalid) return;

    this.isLoading = true;

    handleFormSubmit(
      this.authService.requestPasswordReset({ email: this.email.trim() }),
      this.cdr,
      {
        fallbackError: $localize`:auth.forgot.error.generic@@authForgotErrorGeneric:Impossible d'envoyer le lien pour le moment.`,
        onSuccess: (result) => {
          this.successMessage = result.message;
          this.email = '';
          form.resetForm({ email: '' });
          this.submitted = false;
        },
        onError: (message) => {
          this.errorMessage = message;
          this.isLoading = false;
        },
        onComplete: () => {
          this.isLoading = false;
        },
      },
    );
  }
}
