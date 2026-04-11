import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AUTH_PORT, type AuthPort } from "../../core/ports/auth.port";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";

/**
 * Page de verification d'email.
 * Recupere le token depuis le query param et appelle l'API de verification.
 * Affiche le resultat (succes ou erreur) et redirige vers /login apres succes.
 */
@Component({
  selector: "app-verify-email",
  standalone: true,
  imports: [CommonModule, RouterModule, HeroSectionComponent],
  template: `
    <app-hero-section
      [label]="hero.label"
      [title]="hero.title"
      [description]="hero.description"
    />
    <section class="mx-auto max-w-lg px-4 py-12 text-center">
      @if (isLoading) {
        <p
          class="text-gray-600"
          i18n="verify-email.loading@@verifyEmailLoading"
        >
          Verification en cours...
        </p>
      }
      @if (successMessage) {
        <div
          class="rounded-lg border border-green-200 bg-green-50 p-6"
          role="status"
        >
          <p class="text-green-800">{{ successMessage }}</p>
          <p
            class="mt-4 text-sm text-gray-600"
            i18n="verify-email.redirect@@verifyEmailRedirect"
          >
            Vous allez etre redirige vers la page de connexion...
          </p>
        </div>
      }
      @if (errorMessage) {
        <div
          class="rounded-lg border border-red-200 bg-red-50 p-6"
          role="alert"
        >
          <p class="text-red-800">{{ errorMessage }}</p>
          <a
            routerLink="/login"
            class="mt-4 inline-block text-sm text-indigo-600 underline"
            i18n="verify-email.backToLogin@@verifyEmailBackToLogin"
          >
            Retour a la connexion
          </a>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent implements OnInit {
  private readonly authService: AuthPort = inject(AUTH_PORT);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly hero = {
    label: $localize`:verify-email.hero.label@@verifyEmailHeroLabel:Verification`,
    title: $localize`:verify-email.hero.title@@verifyEmailHeroTitle:Verification de votre email`,
    description: $localize`:verify-email.hero.description@@verifyEmailHeroDescription:Nous verifions votre adresse email...`,
  };

  isLoading = true;
  successMessage?: string;
  errorMessage?: string;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get("token");

    if (!token) {
      this.isLoading = false;
      this.errorMessage = $localize`:verify-email.error.noToken@@verifyEmailErrorNoToken:Aucun token de verification fourni.`;
      this.cdr.markForCheck();
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.successMessage = result.message;
        this.cdr.markForCheck();
        setTimeout(() => {
          void this.router.navigate(["/login"]);
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.detail ??
          err?.error?.message ??
          $localize`:verify-email.error.generic@@verifyEmailErrorGeneric:La verification a echoue. Le lien est peut-etre expire.`;
        this.cdr.markForCheck();
      },
    });
  }
}
