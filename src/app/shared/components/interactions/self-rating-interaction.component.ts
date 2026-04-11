import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from "@angular/core";
import type { SelfRatingInteraction } from "../../models/slide.model";

/**
 * Échelle d'auto-évaluation pour le mode scroll.
 *
 * Affiche une question avec un slider ou des boutons radio de min à max.
 * Labels aux extrémités. Feedback visuel quand la valeur est sélectionnée.
 * Données éphémères (signal local uniquement).
 */
@Component({
  selector: "app-self-rating-interaction",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-gray-50/50 p-5 sm:p-6 transition-colors"
      [class.border-scheme-accent]="selected() !== null"
    >
      <p class="text-sm font-semibold text-gray-900 mb-4">
        <span class="mr-2 text-scheme-accent">&#9733;</span>
        {{ config().question }}
      </p>

      <!-- Boutons radio visuels -->
      <div class="flex items-center justify-center gap-2 sm:gap-3">
        @for (value of scaleValues(); track value) {
          <button
            type="button"
            class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 text-sm font-bold transition-all"
            [class.border-scheme-accent]="selected() === value"
            [class.bg-scheme-accent]="selected() === value"
            [class.text-white]="selected() === value"
            [class.border-gray-200]="selected() !== value"
            [class.bg-white]="selected() !== value"
            [class.text-gray-600]="selected() !== value"
            [class.hover:border-scheme-accent]="selected() !== value"
            [class.shadow-sm]="selected() !== value"
            [class.shadow-md]="selected() === value"
            (click)="select(value)"
          >
            {{ value }}
          </button>
        }
      </div>

      <!-- Labels min/max -->
      <div class="mt-2 flex justify-between text-xs text-gray-400">
        <span>{{ config().labels.min }}</span>
        <span>{{ config().labels.max }}</span>
      </div>

      @if (selected() !== null) {
        <p class="mt-3 text-center text-xs text-scheme-accent/70">
          Votre réponse : {{ selected() }}/{{ config().max }}
        </p>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class SelfRatingInteractionComponent {
  readonly config = input.required<SelfRatingInteraction>();

  /** Emis lorsque le lecteur selectionne une valeur sur l'echelle. */
  readonly valueSelected = output<number>();

  readonly selected = signal<number | null>(null);

  /** Génère le tableau de valeurs [min, min+1, ..., max] */
  readonly scaleValues = (): number[] => {
    const cfg = this.config();
    const values: number[] = [];
    for (let i = cfg.min; i <= cfg.max; i++) {
      values.push(i);
    }
    return values;
  };

  select(value: number): void {
    this.selected.set(value);
    this.valueSelected.emit(value);
  }
}
