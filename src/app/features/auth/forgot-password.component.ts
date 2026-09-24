import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { AuthShellComponent } from '../../shared/components/auth-shell/auth-shell.component';
import { AuthSuccessComponent } from '../../shared/components/auth-success/auth-success.component';
import { AuthErreurComponent } from './auth-erreur.component';
import { FormulaireDeMotDePasse } from './formulaire-de-mot-de-passe';

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
    AuthErreurComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent extends FormulaireDeMotDePasse {
  email = '';

  submit(form: NgForm): void {
    this.submitted = true;
    this.successMessage = undefined;
    this.errorMessage = undefined;

    if (form.invalid) return;

    this.envoyer(
      this.authService.requestPasswordReset({ email: this.email.trim() }),
      $localize`:auth.forgot.error.generic@@authForgotErrorGeneric:Impossible d'envoyer le lien pour le moment.`,
      () => {
        this.email = '';
        form.resetForm({ email: '' });
      },
    );
  }
}
