import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  LOCALE_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { estUneAdresseEmail } from '../../../../cours/runtime/core/adresse-email';
import { langueDuSite } from '../../../core/config/locales';
import { LEAD_MAGNET_PORT } from '../../../core/ports/lead-magnet.port';
import type { ToolkitRequest } from '../../../core/models/toolkit-request.model';
import { HoneypotDirective } from '../../directives/honeypot.directive';
import { InteractionCollectorService } from '../../services/interaction-collector.service';
import { readInputValue, readCheckboxChecked } from '../../utils/dom-event.utils';
import { BORNES_D_UN_NOM, erreursDeLongueur } from '../../utils/regles-de-saisie';
import { FieldErrorsComponent } from '../field-errors/field-errors.component';

type FormState = 'idle' | 'loading' | 'success' | 'error';

const TOOLKIT_FORM_TERMS_VERSION = '2026-04-10';

@Component({
  selector: 'app-toolkit-form',
  standalone: true,
  imports: [CommonModule, FieldErrorsComponent, HoneypotDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state()) {
      @case ('success') {
        <div class="text-center py-6" data-toolkit-success>
          <p class="text-lg font-medium text-scheme-accent" i18n="@@toolkit-form.success.title">
            Envoyé !
          </p>
          <p class="mt-2 text-sm text-scheme-text-muted">
            <span i18n="@@toolkit-form.success.checkInbox">Vérifiez votre boîte mail</span>
            ({{ submittedEmail() }})
          </p>
        </div>
      }
      @default {
        <form (submit)="$event.preventDefault(); onSubmit()" class="space-y-4">
          <input
            appHoneypot
            name="website"
            [value]="website()"
            (input)="website.set(readInputValue($event))"
          />
          <input type="hidden" name="formStartedAt" [value]="formStartedAt()" />
          <div>
            <input
              type="text"
              [value]="firstName()"
              (input)="firstName.set(readInputValue($event))"
              i18n-placeholder="@@toolkit-form.firstName.placeholder"
              placeholder="Votre prénom"
              class="w-full rounded-lg border border-scheme-border px-4 py-3 text-sm text-scheme-text focus:outline-none focus:ring-2 focus:ring-scheme-accent-focus"
              autocomplete="given-name"
              required
            />
            @if (firstName().length > 0 && erreursDuPrenom(); as erreurs) {
              <p appFieldErrors class="mt-1 text-sm text-red-600" [errors]="erreurs"></p>
            }
          </div>
          <div>
            <input
              type="email"
              [value]="email()"
              (input)="email.set(readInputValue($event))"
              i18n-placeholder="@@toolkit-form.email.placeholder"
              placeholder="Votre email"
              class="w-full rounded-lg border border-scheme-border px-4 py-3 text-sm text-scheme-text focus:outline-none focus:ring-2 focus:ring-scheme-accent-focus"
              autocomplete="email"
              required
            />
            @if (erreurDAdresse(); as erreurs) {
              <p appFieldErrors class="mt-1 text-sm text-red-600" [errors]="erreurs"></p>
            }
          </div>
          <label class="flex items-start gap-2 text-xs text-scheme-text-muted cursor-pointer">
            <input
              type="checkbox"
              [checked]="termsAccepted()"
              (change)="termsAccepted.set(readCheckboxChecked($event))"
              class="mt-0.5 accent-scheme-accent"
            />
            <span i18n="@@toolkit-form.terms.label">
              J'accepte que mes données soient utilisées pour recevoir la boîte à outils.
            </span>
          </label>

          @if (state() === 'error') {
            <p class="text-sm text-red-600" data-toolkit-error i18n="@@toolkit-form.error.message">
              Une erreur est survenue. Réessayez.
            </p>
          }

          <button
            type="submit"
            [disabled]="!isValid() || state() === 'loading'"
            class="w-full rounded-full bg-scheme-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-scheme-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (state() === 'loading') {
              <span i18n="@@toolkit-form.submit.loading">Envoi en cours...</span>
            } @else {
              <span i18n="@@toolkit-form.submit.idle">Recevoir la boîte à outils</span>
            }
          </button>
        </form>
      }
    }
  `,
})
export class ToolkitFormComponent {
  readonly formationSlug = 'ia-solopreneurs';

  private readonly port = inject(LEAD_MAGNET_PORT);
  private readonly collector = inject(InteractionCollectorService, {
    optional: true,
  });

  /**
   * Locale courante detectee par Angular via `LOCALE_ID`. Sert de valeur
   * `termsLocale` persistee dans le backend : on garde la trace de la
   * langue dans laquelle l'utilisateur a accepte les CGV (RGPD).
   */
  constructor(@Inject(LOCALE_ID) private readonly locale: string) {}

  readonly firstName = signal('');
  readonly email = signal('');
  readonly website = signal('');
  readonly formStartedAt = signal(Date.now());
  readonly termsAccepted = signal(false);
  readonly state = signal<FormState>('idle');
  readonly submittedEmail = signal('');

  protected readonly erreursDuPrenom = computed(() =>
    erreursDeLongueur(this.firstName(), BORNES_D_UN_NOM),
  );

  protected readonly erreurDAdresse = computed(() => {
    const adresse = this.email().trim();
    return adresse.length > 0 && !estUneAdresseEmail(adresse) ? { email: true } : null;
  });

  readonly isValid = computed(
    () =>
      this.erreursDuPrenom() === null &&
      estUneAdresseEmail(this.email().trim()) &&
      this.termsAccepted(),
  );

  protected readInputValue = readInputValue;

  protected readCheckboxChecked = readCheckboxChecked;

  onSubmit(): void {
    if (!this.isValid()) return;

    this.state.set('loading');
    this.submittedEmail.set(this.email());

    const request: ToolkitRequest = {
      website: this.website(),
      formStartedAt: this.formStartedAt(),
      firstName: this.firstName().trim(),
      email: this.email().trim(),
      formationSlug: this.formationSlug,
      termsVersion: TOOLKIT_FORM_TERMS_VERSION,
      termsLocale: langueDuSite(this.locale),
      termsAcceptedAt: new Date().toISOString(),
    };

    if (this.collector?.hasData()) {
      request.profile = this.collector.profile();
    }

    this.port.requestToolkit(request).subscribe({
      next: () => this.state.set('success'),
      error: () => this.state.set('error'),
    });
  }
}
