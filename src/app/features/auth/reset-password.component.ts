import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import type { NgForm } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";
import { handleFormSubmit } from "../../shared/utils/form-submit.utils";

@Component({
  selector: "app-reset-password",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeroSectionComponent],
  templateUrl: "./reset-password.component.html",
  styleUrl: "./reset-password.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  token: string | null = null;
  newPassword = "";
  confirmPassword = "";
  submitted = false;
  isLoading = false;
  successMessage?: string;
  errorMessage?: string;

  readonly hero = {
    label: $localize`:auth.reset.hero.label@@authResetHeroLabel:Sécurité`,
    title: $localize`:auth.reset.hero.title@@authResetHeroTitle:Réinitialiser le mot de passe`,
    description: $localize`:auth.reset.hero.description@@authResetHeroDescription:Choisissez un nouveau mot de passe robuste pour sécuriser votre compte.`,
  };

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get("token");
    this.token = token?.trim() || null;

    if (!this.token) {
      this.errorMessage = $localize`:auth.reset.error.missingToken@@authResetErrorMissingToken:Le lien de réinitialisation est invalide ou incomplet.`;
    }
  }

  submit(form: NgForm): void {
    this.submitted = true;
    this.successMessage = undefined;
    this.errorMessage = this.token
      ? undefined
      : $localize`:auth.reset.error.missingToken@@authResetErrorMissingToken:Le lien de réinitialisation est invalide ou incomplet.`;

    if (!this.token || form.invalid) return;

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = $localize`:auth.reset.error.mismatch@@authResetErrorMismatch:Les mots de passe ne correspondent pas.`;
      return;
    }

    this.isLoading = true;

    handleFormSubmit(
      this.authService.resetPassword({
        token: this.token,
        newPassword: this.newPassword,
      }),
      this.cdr,
      {
        fallbackError: $localize`:auth.reset.error.generic@@authResetErrorGeneric:Impossible de réinitialiser le mot de passe.`,
        onSuccess: (result) => {
          this.successMessage = result.message;
          this.newPassword = "";
          this.confirmPassword = "";
          form.resetForm({ newPassword: "", confirmPassword: "" });
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
