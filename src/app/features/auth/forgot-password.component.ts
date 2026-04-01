import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from "@angular/core";
import type { NgForm } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";
import { handleFormSubmit } from "../../shared/utils/form-submit.utils";

@Component({
  selector: "app-forgot-password",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeroSectionComponent],
  templateUrl: "./forgot-password.component.html",
  styleUrl: "./forgot-password.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  email = "";
  submitted = false;
  isLoading = false;
  successMessage?: string;
  errorMessage?: string;

  readonly hero = {
    label: $localize`:auth.forgot.hero.label@@authForgotHeroLabel:Sécurité`,
    title: $localize`:auth.forgot.hero.title@@authForgotHeroTitle:Mot de passe oublié`,
    description: $localize`:auth.forgot.hero.description@@authForgotHeroDescription:Entrez votre email pour recevoir un lien de réinitialisation.`,
  };

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
          this.email = "";
          form.resetForm({ email: "" });
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
