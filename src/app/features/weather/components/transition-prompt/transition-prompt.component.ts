import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { WeatherLevelService } from "../../services/weather-level.service";

/**
 * Banniere de suggestion de transition de niveau.
 * S'affiche lorsque l'utilisateur a accumule suffisamment de jours
 * pour debloquer le niveau suivant (Curieux ou Expert).
 * Permet d'activer le nouveau niveau ou de fermer la banniere.
 */
@Component({
  selector: "app-transition-prompt",
  standalone: true,
  template: `
    @if (levelService.showTransitionPrompt() && !dismissed()) {
      <div
        class="relative rounded-2xl border border-white/20 bg-gradient-to-r from-white/10 to-white/5 p-4 backdrop-blur-md"
        role="status"
      >
        <div class="flex items-center justify-between gap-4">
          <p
            class="text-sm text-white/90"
            i18n="weather.transition.message|@@weatherTransitionMessage"
          >
            Des donnees avancees sont disponibles.
          </p>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/30"
              (click)="activate()"
            >
              {{ activateLabel }}
            </button>

            <button
              type="button"
              class="flex h-6 w-6 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              [attr.aria-label]="dismissLabel"
              (click)="dismiss()"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransitionPromptComponent {
  readonly levelService = inject(WeatherLevelService);

  /** Indique si l'utilisateur a ferme la banniere. */
  readonly dismissed = signal(false);

  /** Label du bouton d'activation, localise selon le niveau suggere. */
  get activateLabel(): string {
    const next = this.levelService.showTransitionPrompt();
    if (next === "curious") {
      return $localize`:weather.transition.activate.curious|@@weatherTransitionActivateCurious:Activer le mode Curieux`;
    }
    if (next === "expert") {
      return $localize`:weather.transition.activate.expert|@@weatherTransitionActivateExpert:Activer le mode Expert`;
    }
    return "";
  }

  /** Label d'accessibilite du bouton de fermeture. */
  readonly dismissLabel = $localize`:weather.transition.dismiss|@@weatherTransitionDismiss:Fermer la suggestion`;

  /** Active le niveau suggere. */
  activate(): void {
    const next = this.levelService.showTransitionPrompt();
    if (next) {
      this.levelService.setLevel(next);
      this.dismissed.set(true);
    }
  }

  /** Ferme la banniere sans changer de niveau. */
  dismiss(): void {
    this.dismissed.set(true);
  }
}
