import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import type { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { AuthShellComponent } from '../../shared/components/auth-shell/auth-shell.component';
import { AuthSuccessComponent } from '../../shared/components/auth-success/auth-success.component';
import { AuthErreurComponent } from './auth-erreur.component';
import { FormulaireDeMotDePasse } from './formulaire-de-mot-de-passe';

const LIEN_INCOMPLET = $localize`:auth.reset.error.missingToken@@authResetErrorMissingToken:Le lien de réinitialisation est invalide ou incomplet.`;

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent extends FormulaireDeMotDePasse implements OnInit {
  private readonly route = inject(ActivatedRoute);

  token: string | null = null;
  newPassword = '';
  confirmPassword = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    this.token = token?.trim() || null;

    if (!this.token) {
      this.errorMessage = LIEN_INCOMPLET;
    }
  }

  submit(form: NgForm): void {
    this.submitted = true;
    this.successMessage = undefined;
    this.errorMessage = this.token ? undefined : LIEN_INCOMPLET;

    if (!this.token || form.invalid) return;

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = $localize`:auth.reset.error.mismatch@@authResetErrorMismatch:Les mots de passe ne correspondent pas.`;
      return;
    }

    this.envoyer(
      this.authService.resetPassword({
        token: this.token,
        newPassword: this.newPassword,
      }),
      $localize`:auth.reset.error.generic@@authResetErrorGeneric:Impossible de réinitialiser le mot de passe.`,
      () => {
        this.newPassword = '';
        this.confirmPassword = '';
        form.resetForm({ newPassword: '', confirmPassword: '' });
      },
    );
  }
}
