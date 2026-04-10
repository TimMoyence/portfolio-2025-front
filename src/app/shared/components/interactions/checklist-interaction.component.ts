import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from "@angular/core";
import type { ChecklistInteraction } from "../../models/slide.model";

/**
 * Checklist interactive pour le mode scroll.
 *
 * Affiche une liste d'items cochables. Le lecteur indique lesquels
 * il utilise/connaît déjà. Feedback visuel avec compteur.
 * Données éphémères (signal local uniquement).
 */
@Component({
  selector: "app-checklist-interaction",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-gray-50/50 p-5 sm:p-6"
    >
      <p class="text-sm font-semibold text-gray-900 mb-4">
        <span class="mr-2 text-scheme-accent">&#10003;</span>
        {{ config().question }}
      </p>
      <div class="space-y-2">
        @for (item of config().items; track item; let i = $index) {
          <div
            class="flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm text-gray-700 shadow-sm transition-all"
            [class.border-scheme-accent]="checked().has(i)"
            [class.border-gray-200]="!checked().has(i)"
            role="checkbox"
            [attr.aria-checked]="checked().has(i)"
            (click)="toggle(i)"
            (keydown.space)="toggle(i); $event.preventDefault()"
            tabindex="0"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-scheme-accent accent-scheme-accent pointer-events-none"
              [checked]="checked().has(i)"
              tabindex="-1"
            />
            <span
              [class.font-medium]="checked().has(i)"
              [class.text-scheme-accent]="checked().has(i)"
            >
              {{ item }}
            </span>
          </div>
        }
      </div>
      @if (checkedCount() > 0) {
        <p class="mt-3 text-xs text-scheme-accent/70">
          {{ checkedCount() }}/{{ config().items.length }} sélectionnés
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
export class ChecklistInteractionComponent {
  readonly config = input.required<ChecklistInteraction>();

  readonly checked = signal<Set<number>>(new Set());

  readonly checkedCount = computed(() => this.checked().size);

  toggle(index: number): void {
    this.checked.update((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }
}
