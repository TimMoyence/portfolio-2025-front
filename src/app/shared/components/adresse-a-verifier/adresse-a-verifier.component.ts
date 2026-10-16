import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent } from 'rxjs';
import { AUTH_PORT, type AuthPort } from '../../../core/ports/auth.port';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { ADRESSE_NON_VERIFIEE, handleFormSubmit } from '../../utils/form-submit.utils';

@Component({
  selector: 'app-adresse-a-verifier',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (authState.user(); as compte) {
      @if (!compte.emailVerified) {
        <section
          data-testid="adresse-a-verifier"
          class="mx-auto my-4 flex max-w-xl flex-col items-center gap-3 rounded-lg border border-scheme-border bg-scheme-surface p-4 text-center text-scheme-text"
        >
          <p>{{ message }}</p>
          <button
            type="button"
            data-testid="adresse-a-verifier-renvoi"
            class="rounded-full bg-scheme-accent px-5 py-2 font-semibold text-scheme-on-accent hover:bg-scheme-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-scheme-accent disabled:opacity-60"
            [disabled]="envoiEnCours"
            (click)="renvoyer(compte.email)"
            i18n="adresseAVerifier.renvoi|@@adresseAVerifierRenvoi"
          >
            Renvoyer le lien
          </button>
          <p data-testid="adresse-a-verifier-retour" role="status">{{ retour }}</p>
        </section>
      }
    }
  `,
})
export class AdresseAVerifierComponent {
  protected readonly authState = inject(AuthStateService);
  private readonly authService: AuthPort = inject(AUTH_PORT);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly document = inject(DOCUMENT);

  protected readonly message = ADRESSE_NON_VERIFIEE;
  protected envoiEnCours = false;
  protected retour = '';

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    fromEvent(this.document, 'visibilitychange')
      .pipe(
        filter(() => this.document.visibilityState === 'visible' && this.adresseAVerifier()),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.authState.relireLeCompte());
  }

  private adresseAVerifier(): boolean {
    return this.authState.user()?.emailVerified === false;
  }

  protected renvoyer(email: string): void {
    this.envoiEnCours = true;
    this.retour = '';
    handleFormSubmit(this.authService.resendVerification({ email }), this.cdr, {
      onSuccess: () => {
        this.retour = $localize`:@@adresseAVerifierEnvoye:Demande reçue : un nouveau lien part vers votre adresse, sauf si trois liens sont déjà partis dans l’heure ; ouvrez alors le plus récent.`;
        this.authState.relireLeCompte();
      },
      onError: (message) => {
        this.retour = message;
      },
      finalement: () => {
        this.envoiEnCours = false;
      },
      fallbackError: $localize`:@@adresseAVerifierIndisponible:Le lien n’a pas pu être renvoyé pour le moment : réessayez dans un instant.`,
    });
  }
}
