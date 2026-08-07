import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { WeatherLevelService } from '../../services/weather-level.service';

@Component({
  selector: 'app-transition-prompt',
  standalone: true,
  host: { class: 'block' },
  template: `
    @if (levelService.showTransitionPrompt() && !dismissed()) {
      <div
        class="relative rounded-[20px] border border-teal/15 bg-white/5 p-4 backdrop-blur-xl"
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
              class="chevron-pulse rounded-full bg-teal px-3 py-1.5 text-sm font-semibold text-[#06231f] transition-colors hover:brightness-110"
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

  readonly dismissed = signal(false);

  get activateLabel(): string {
    const next = this.levelService.showTransitionPrompt();
    if (next === 'curious') {
      return $localize`:weather.transition.activate.curious|@@weatherTransitionActivateCurious:Activer le mode Curieux`;
    }
    if (next === 'expert') {
      return $localize`:weather.transition.activate.expert|@@weatherTransitionActivateExpert:Activer le mode Expert`;
    }
    return '';
  }

  readonly dismissLabel = $localize`:weather.transition.dismiss|@@weatherTransitionDismiss:Fermer la suggestion`;

  activate(): void {
    const next = this.levelService.showTransitionPrompt();
    if (next) {
      this.levelService.setLevel(next);
      this.dismissed.set(true);
    }
  }

  dismiss(): void {
    this.dismissed.set(true);
  }
}
