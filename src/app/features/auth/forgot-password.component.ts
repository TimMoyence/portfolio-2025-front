import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { FormulaireAuthComponent } from './formulaire-auth.component';
import { FormulaireDeMotDePasse } from './formulaire-de-mot-de-passe';
import { IMPORTS_PAGE_AUTH } from './page-auth.imports';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [IMPORTS_PAGE_AUTH, FormsModule, FormulaireAuthComponent],
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
