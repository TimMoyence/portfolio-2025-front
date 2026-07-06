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
import type { AuthPort } from "../../core/ports/auth.port";
import { AUTH_PORT } from "../../core/ports/auth.port";
import { RevealOnScrollDirective } from "../../shared/directives/reveal-on-scroll.directive";
import { AuthShellComponent } from "../../shared/components/auth-shell/auth-shell.component";
import { AuthSuccessComponent } from "../../shared/components/auth-success/auth-success.component";
import { handleFormSubmit } from "../../shared/utils/form-submit.utils";

@Component({
  selector: "app-reset-password",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RevealOnScrollDirective,
    AuthShellComponent,
    AuthSuccessComponent,
  ],
  templateUrl: "./reset-password.component.html",
  styleUrl: "./reset-password.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  private readonly authService: AuthPort = inject(AUTH_PORT);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  token: string | null = null;
  newPassword = "";
  confirmPassword = "";
  submitted = false;
  isLoading = false;
  successMessage?: string;
  errorMessage?: string;

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
