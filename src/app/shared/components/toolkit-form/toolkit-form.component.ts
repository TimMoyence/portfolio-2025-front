import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { LEAD_MAGNET_PORT } from "../../../core/ports/lead-magnet.port";
import type { ToolkitRequest } from "../../../core/models/toolkit-request.model";
import { InteractionCollectorService } from "../../services/interaction-collector.service";

type FormState = "idle" | "loading" | "success" | "error";

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
          <p class="text-lg font-medium text-scheme-accent">Envoyé !</p>
          <p class="mt-2 text-sm text-scheme-text-muted">
            Vérifiez votre boîte mail ({{ submittedEmail() }})
          </p>
        </div>
      }
      @default {
        <form (submit)="$event.preventDefault(); onSubmit()" class="space-y-4">
          <div>
            <input
              type="text"
              [value]="firstName()"
              (input)="firstName.set($any($event.target).value)"
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
              (input)="email.set($any($event.target).value)"
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
              (change)="termsAccepted.set($any($event.target).checked)"
              class="mt-0.5 accent-scheme-accent"
            />
            <span>
              J'accepte que mes données soient utilisées pour recevoir la boîte
              à outils.
            </span>
          </label>

          @if (state() === "error") {
            <p class="text-sm text-red-600" data-toolkit-error>
              Une erreur est survenue. Réessayez.
            </p>
          }

          <button
            type="submit"
            [disabled]="!isValid() || state() === 'loading'"
            class="w-full rounded-full bg-scheme-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-scheme-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (state() === "loading") {
              <span>Envoi en cours...</span>
            } @else {
              <span>Recevoir la boîte à outils</span>
            }
          </button>
        </form>
      }
    }
  `,
})
export class ToolkitFormComponent {
  private readonly port = inject(LEAD_MAGNET_PORT);
  /** Collecteur optionnel — present uniquement si un parent le fournit. */
  private readonly collector = inject(InteractionCollectorService, {
    optional: true,
  });

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

  onSubmit(): void {
    if (!this.isValid()) return;

    this.state.set("loading");
    this.submittedEmail.set(this.email());

    const request: ToolkitRequest = {
      firstName: this.firstName().trim(),
      email: this.email().trim(),
      formationSlug: "ia-solopreneurs",
      termsVersion: "2026-04-10",
      termsLocale: "fr",
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
