import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import type { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FormulaireAuthComponent } from './formulaire-auth.component';
import { FormulaireDeMotDePasse } from './formulaire-de-mot-de-passe';
import { IMPORTS_PAGE_AUTH } from './page-auth.imports';

const LIEN_INCOMPLET = $localize`:auth.reset.error.missingToken@@authResetErrorMissingToken:Le lien de réinitialisation est invalide ou incomplet.`;

type ChampDeMotDePasse = 'newPassword' | 'confirmPassword';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [IMPORTS_PAGE_AUTH, FormsModule, FormulaireAuthComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent extends FormulaireDeMotDePasse implements OnInit {
  private readonly route = inject(ActivatedRoute);

  token: string | null = null;
  motsDePasse: Record<ChampDeMotDePasse, string> = { newPassword: '', confirmPassword: '' };

  protected readonly champs: readonly {
    cle: ChampDeMotDePasse;
    libelle: string;
    placeholder: string;
    indication?: string;
  }[] = [
    {
      cle: 'newPassword',
      libelle: $localize`:@@authResetPasswordLabel:Nouveau mot de passe`,
      placeholder: $localize`:@@authResetPasswordPlaceholder:12 caractères minimum`,
    },
    {
      cle: 'confirmPassword',
      libelle: $localize`:@@authResetConfirmLabel:Confirmer le mot de passe`,
      placeholder: '••••••••',
      indication: $localize`:@@authResetConfirmHint:Les deux doivent correspondre.`,
    },
  ];

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

    const { newPassword, confirmPassword } = this.motsDePasse;
    if (newPassword !== confirmPassword) {
      this.errorMessage = $localize`:auth.reset.error.mismatch@@authResetErrorMismatch:Les mots de passe ne correspondent pas.`;
      return;
    }

    this.envoyer(
      this.authService.resetPassword({ token: this.token, newPassword }),
      $localize`:auth.reset.error.generic@@authResetErrorGeneric:Impossible de réinitialiser le mot de passe.`,
      () => {
        this.motsDePasse = { newPassword: '', confirmPassword: '' };
        form.resetForm(this.motsDePasse);
      },
    );
  }
}
