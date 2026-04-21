import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from "@angular/core";
import type { QuizInteraction } from "../../models/slide.model";

/**
 * Interaction quiz pour le mode scroll.
 *
 * Gere trois variantes :
 * - `single-choice` : boutons radio, une valeur. Emet un `string`.
 * - `multi-choice` : checkboxes, plusieurs valeurs. Emet un `string[]`.
 * - `free-text` : `<textarea>` libre. Emet un `string` (debounce fin de saisie).
 *
 * Emission via `valueChanged` — le parent decide de l'alimentation du
 * profil d'interaction (service) ou du tracking analytics. Les donnees
 * restent locales au composant (signal) tant que l'utilisateur n'a pas
 * emis. Typees strictement — pas de `unknown` qui remonte au parent.
 */
@Component({
  selector: "app-quiz-interaction",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-gray-50/50 p-5 sm:p-6 transition-colors"
      [class.border-scheme-accent]="hasSelection()"
      [attr.data-quiz-id]="config().id"
    >
      <p class="text-sm font-semibold text-gray-900 mb-1">
        <span class="mr-2 text-scheme-accent">&#9733;</span>
        {{ config().question }}
      </p>
      @if (config().hint) {
        <p class="text-xs text-gray-400 mb-4">{{ config().hint }}</p>
      } @else {
        <div class="mb-3"></div>
      }

      @switch (config().kind) {
        @case ("single-choice") {
          <div class="flex flex-col gap-2">
            @for (opt of config().options; track opt.value) {
              <button
                type="button"
                class="flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm transition-all"
                [class.border-scheme-accent]="singleValue() === opt.value"
                [class.bg-scheme-accent]="singleValue() === opt.value"
                [class.text-white]="singleValue() === opt.value"
                [class.border-gray-200]="singleValue() !== opt.value"
                [class.bg-white]="singleValue() !== opt.value"
                [class.text-gray-700]="singleValue() !== opt.value"
                [class.hover:border-scheme-accent]="singleValue() !== opt.value"
                (click)="selectSingle(opt.value)"
                [attr.data-quiz-option]="opt.value"
              >
                <span
                  class="flex h-5 w-5 flex-none items-center justify-center rounded-full border-2"
                  [class.border-white]="singleValue() === opt.value"
                  [class.bg-white]="singleValue() === opt.value"
                  [class.border-gray-300]="singleValue() !== opt.value"
                >
                  @if (singleValue() === opt.value) {
                    <span class="h-2 w-2 rounded-full bg-scheme-accent"></span>
                  }
                </span>
                <span>{{ opt.label }}</span>
              </button>
            }
          </div>
        }

        @case ("multi-choice") {
          <div class="flex flex-col gap-2">
            @for (opt of config().options; track opt.value) {
              <label
                class="flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-sm cursor-pointer transition-all"
                [class.border-scheme-accent]="isMultiChecked(opt.value)"
                [class.bg-scheme-accent]="isMultiChecked(opt.value)"
                [class.text-white]="isMultiChecked(opt.value)"
                [class.border-gray-200]="!isMultiChecked(opt.value)"
                [class.bg-white]="!isMultiChecked(opt.value)"
                [class.text-gray-700]="!isMultiChecked(opt.value)"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4 accent-scheme-accent"
                  [checked]="isMultiChecked(opt.value)"
                  (change)="toggleMulti(opt.value, readCheckboxChecked($event))"
                  [attr.data-quiz-option]="opt.value"
                />
                <span>{{ opt.label }}</span>
              </label>
            }
          </div>
        }

        @case ("free-text") {
          <textarea
            class="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 focus:border-scheme-accent focus:outline-none transition-all"
            rows="4"
            [value]="freeText()"
            (input)="setFreeText(readInputValue($event))"
            [attr.placeholder]="config().placeholder ?? ''"
            data-quiz-free-text
          ></textarea>
        }
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
export class QuizInteractionComponent {
  readonly config = input.required<QuizInteraction>();

  /** Valeur emise : string (single/free-text) ou string[] (multi-choice). */
  readonly valueChanged = output<string | string[]>();

  /** Etat local — valeur selectionnee pour la variante single-choice. */
  readonly singleValue = signal<string | null>(null);
  /** Etat local — ensemble des valeurs cochees pour la multi-choice. */
  readonly multiValues = signal<ReadonlySet<string>>(new Set());
  /** Etat local — saisie libre pour la free-text. */
  readonly freeText = signal("");

  /**
   * `true` si l'utilisateur a fait un choix (quelle que soit la variante).
   * Sert uniquement pour le style de bordure active.
   */
  readonly hasSelection = computed(() => {
    switch (this.config().kind) {
      case "single-choice":
        return this.singleValue() !== null;
      case "multi-choice":
        return this.multiValues().size > 0;
      case "free-text":
        return this.freeText().trim().length > 0;
    }
  });

  selectSingle(value: string): void {
    this.singleValue.set(value);
    this.valueChanged.emit(value);
  }

  isMultiChecked(value: string): boolean {
    return this.multiValues().has(value);
  }

  toggleMulti(value: string, checked: boolean): void {
    const next = new Set(this.multiValues());
    if (checked) {
      next.add(value);
    } else {
      next.delete(value);
    }
    this.multiValues.set(next);
    this.valueChanged.emit([...next]);
  }

  setFreeText(text: string): void {
    this.freeText.set(text);
    this.valueChanged.emit(text);
  }

  /** Helpers typ-safe pour les handlers d'evenements (evite $any). */
  protected readInputValue(event: Event): string {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      return target.value;
    }
    return "";
  }

  protected readCheckboxChecked(event: Event): boolean {
    const target = event.target;
    return target instanceof HTMLInputElement ? target.checked : false;
  }
}
