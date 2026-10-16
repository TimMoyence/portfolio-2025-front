import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AUTH_PORT, type AuthPort } from '../../core/ports/auth.port';
import { AuthStateService } from '../../core/services/auth-state.service';
import { handleFormSubmit } from '../../shared/utils/form-submit.utils';
import { IMPORTS_PAGE_AUTH } from './page-auth.imports';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [IMPORTS_PAGE_AUTH],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent implements OnInit {
  private readonly authService: AuthPort = inject(AUTH_PORT);
  private readonly authState = inject(AuthStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = true;
  successMessage?: string;
  errorMessage?: string;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.isLoading = false;
      this.errorMessage = $localize`:verify-email.error.noToken@@verifyEmailErrorNoToken:Le lien de vérification est incomplet : ouvrez-le depuis l’e-mail reçu.`;
      this.cdr.markForCheck();
      return;
    }

    handleFormSubmit(this.authService.verifyEmail(token), this.cdr, {
      onSuccess: () => {
        this.isLoading = false;
        this.successMessage = $localize`:@@verifyEmailSucces:Votre adresse e-mail est vérifiée : votre compte est activé.`;
        this.relireLeCompteConnecte();
        setTimeout(() => {
          void this.router.navigate(['/login']);
        }, 3000);
      },
      onError: (message) => {
        this.isLoading = false;
        this.errorMessage = message;
      },
      refus: {
        404: $localize`:verify-email.error.generic@@verifyEmailErrorGeneric:La vérification a échoué : le lien est invalide ou a expiré.`,
      },
      fallbackError: $localize`:@@verifyEmailErreurIndisponible:La vérification n’a pas pu aboutir pour le moment : réessayez dans un instant.`,
    });
  }

  private relireLeCompteConnecte(): void {
    if (!this.authState.isLoggedIn()) return;
    this.authService.me().subscribe({
      next: (compte) => this.authState.updateUser(compte),
      error: () => undefined,
    });
  }
}
