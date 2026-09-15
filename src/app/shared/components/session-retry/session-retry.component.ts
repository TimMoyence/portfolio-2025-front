import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthStateService } from '../../../core/services/auth-state.service';

@Component({
  selector: 'app-session-retry',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (authState.isRestoreFailed()) {
      <section
        data-testid="session-retry"
        role="alert"
        class="mx-auto my-8 flex max-w-xl flex-col items-center gap-4 rounded-lg border border-scheme-border bg-scheme-surface p-6 text-center text-scheme-text"
      >
        <p i18n="sessionRetry.message|@@sessionRetryMessage">
          La vérification de votre session n'a pas abouti. Votre connexion est conservée : vérifiez
          le réseau, puis réessayez.
        </p>
        <button
          type="button"
          data-testid="session-retry-bouton"
          class="rounded-full bg-scheme-accent px-5 py-2 font-semibold text-scheme-on-accent hover:bg-scheme-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-scheme-accent"
          (click)="authState.restoreSession()"
          i18n="sessionRetry.button|@@sessionRetryButton"
        >
          Réessayer
        </button>
      </section>
    }
  `,
})
export class SessionRetryComponent {
  protected readonly authState = inject(AuthStateService);
}
