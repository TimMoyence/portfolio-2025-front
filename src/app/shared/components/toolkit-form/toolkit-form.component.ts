import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Input,
  LOCALE_ID,
  computed,
  inject,
  signal,
} from "@angular/core";
import { LEAD_MAGNET_PORT } from "../../../core/ports/lead-magnet.port";
import type { ToolkitRequest } from "../../../core/models/toolkit-request.model";
import { InteractionCollectorService } from "../../services/interaction-collector.service";

type FormState = "idle" | "loading" | "success" | "error";

/**
 * Version courante des Conditions Generales de Vente acceptees via le
 * formulaire de capture. Doit etre bumpee a chaque evolution juridique
 * des CGV ; persistee telle quelle dans `LeadMagnetRequest.termsVersion`
 * comme preuve de consentement RGPD.
 */
export const TOOLKIT_FORM_TERMS_VERSION = "2026-04-10";

/**
 * Formulaire de capture lead magnet (prenom + email + GDPR).
 * Reutilise dans la slide CTA et la page toolkit standalone.
 */
@Component({
  selector: "app-toolkit-form",
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state()) {
      @case ("success") {
        <div class="text-center py-6" data-toolkit-success>
          <p
            class="text-lg font-medium text-scheme-accent"
            i18n="@@toolkit-form.success.title"
          >
            Envoyé !
          </p>
          <p class="mt-2 text-sm text-scheme-text-muted">
            <span i18n="@@toolkit-form.success.checkInbox"
              >Vérifiez votre boîte mail</span
            >
            ({{ submittedEmail() }})
          </p>
        </div>
      }
      @default {
        <form (submit)="$event.preventDefault(); onSubmit()" class="space-y-4">
          <div>
            <input
              type="text"
              [value]="firstName()"
              (input)="firstName.set(readInputValue($event))"
              i18n-placeholder="@@toolkit-form.firstName.placeholder"
              placeholder="Votre prénom"
              class="w-full rounded-lg border border-scheme-border bg-scheme-background px-4 py-3 text-sm text-scheme-text focus:outline-none focus:ring-2 focus:ring-scheme-accent-focus"
              autocomplete="given-name"
              required
            />
          </div>
          <div>
            <input
              type="email"
              [value]="email()"
              (input)="email.set(readInputValue($event))"
              i18n-placeholder="@@toolkit-form.email.placeholder"
              placeholder="Votre email"
              class="w-full rounded-lg border border-scheme-border bg-scheme-background px-4 py-3 text-sm text-scheme-text focus:outline-none focus:ring-2 focus:ring-scheme-accent-focus"
              autocomplete="email"
              required
            />
          </div>
          <label
            class="flex items-start gap-2 text-xs text-scheme-text-muted cursor-pointer"
          >
            <input
              type="checkbox"
              [checked]="termsAccepted()"
              (change)="termsAccepted.set(readCheckboxChecked($event))"
              class="mt-0.5 accent-scheme-accent"
            />
            <span i18n="@@toolkit-form.terms.label">
              J'accepte que mes données soient utilisées pour recevoir la boîte
              à outils.
            </span>
          </label>

          @if (state() === "error") {
            <p
              class="text-sm text-red-600"
              data-toolkit-error
              i18n="@@toolkit-form.error.message"
            >
              Une erreur est survenue. Réessayez.
            </p>
          }

          <button
            type="submit"
            [disabled]="!isValid() || state() === 'loading'"
            class="w-full rounded-full bg-scheme-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-scheme-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (state() === "loading") {
              <span i18n="@@toolkit-form.submit.loading"
                >Envoi en cours...</span
              >
            } @else {
              <span i18n="@@toolkit-form.submit.idle">{{ submitLabel }}</span>
            }
          </button>
        </form>
      }
    }
  `,
})
export class ToolkitFormComponent {
  /** Slug de la formation dont le toolkit est demande. */
  @Input() formationSlug = "ia-solopreneurs";

  /**
   * Libelle du bouton principal. Par defaut "Recevoir la boite a
   * outils" (context toolkit), override-able par les contextes
   * futurs ("Acceder au rapport", "Telecharger le guide", etc).
   */
  @Input() submitLabel =
    $localize`:@@toolkit-form.submit.idle:Recevoir la boîte à outils`;

  private readonly port = inject(LEAD_MAGNET_PORT);
  /** Collecteur optionnel — present uniquement si un parent le fournit. */
  private readonly collector = inject(InteractionCollectorService, {
    optional: true,
  });

  /**
   * Locale courante detectee par Angular via `LOCALE_ID`. Sert de valeur
   * `termsLocale` persistee dans le backend : on garde la trace de la
   * langue dans laquelle l'utilisateur a accepte les CGV (RGPD).
   */
  constructor(@Inject(LOCALE_ID) private readonly locale: string) {}

  readonly firstName = signal("");
  readonly email = signal("");
  readonly termsAccepted = signal(false);
  readonly state = signal<FormState>("idle");
  readonly submittedEmail = signal("");

  readonly isValid = computed(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      this.firstName().trim().length > 0 &&
      emailRegex.test(this.email()) &&
      this.termsAccepted()
    );
  });

  /** Helper typ-safe pour lire la valeur d'un input depuis un Event. */
  protected readInputValue(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement ? target.value : "";
  }

  /** Helper typ-safe pour lire la checked d'une checkbox depuis un Event. */
  protected readCheckboxChecked(event: Event): boolean {
    const target = event.target;
    return target instanceof HTMLInputElement ? target.checked : false;
  }

  onSubmit(): void {
    if (!this.isValid()) return;

    this.state.set("loading");
    this.submittedEmail.set(this.email());

    const request: ToolkitRequest = {
      firstName: this.firstName().trim(),
      email: this.email().trim(),
      formationSlug: this.formationSlug,
      termsVersion: TOOLKIT_FORM_TERMS_VERSION,
      // Extrait le code langue court (fr, en) quand Angular donne un
      // code regional (fr-FR, en-GB) : le backend n'a besoin que de la
      // langue pour le rendu du mail, pas du pays.
      termsLocale: this.locale.slice(0, 2).toLowerCase(),
      termsAcceptedAt: new Date().toISOString(),
    };

    // Enrichit la requete avec le profil d'interaction si disponible
    if (this.collector?.hasData()) {
      request.profile = this.collector.profile();
    }

    this.port.requestToolkit(request).subscribe({
      next: () => this.state.set("success"),
      error: () => this.state.set("error"),
    });
  }
}
