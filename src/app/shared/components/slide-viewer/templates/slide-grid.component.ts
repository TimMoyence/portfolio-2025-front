import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import type { Slide } from "../../../models/slide.model";

/**
 * Template grid : titre centré suivi d'une grille responsive de cartes.
 * Chaque carte affiche un titre, une description et un badge optionnel.
 *
 * Layout responsive :
 * - Mobile : 1 colonne
 * - Tablette : 2 colonnes (le 3eme item span sur 2 cols si exactement 3 items)
 * - Desktop : 3 colonnes
 */
@Component({
  selector: "app-slide-grid",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex-1 flex flex-col justify-center p-6 sm:p-8 lg:p-10">
      <span
        class="text-[11px] font-bold uppercase tracking-widest text-scheme-accent mb-2 text-center"
      >
        {{ index() + 1 }}/{{ total() }}
      </span>
      <h2
        data-slide-title
        class="font-heading text-h4 sm:text-h3 text-gray-900 leading-tight text-center"
      >
        {{ slide().title }}
      </h2>
      @if (slide().subtitle) {
        <p class="mt-2 text-base text-gray-500 leading-relaxed text-center">
          {{ slide().subtitle }}
        </p>
      }

      @if (slide().gridItems && slide().gridItems!.length > 0) {
        <div
          class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto w-full"
        >
          @for (item of slide().gridItems; track $index; let i = $index) {
            <div
              class="min-w-0 h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              [class.sm:col-span-2]="isLastOf3(i)"
              [class.lg:col-span-1]="isLastOf3(i)"
              data-aos="fade-up"
              [attr.data-aos-delay]="i * 100"
            >
              @if (item.badge) {
                <span
                  class="inline-block mb-3 rounded-full bg-scheme-accent/10 px-3 py-1 text-[11px] font-semibold text-scheme-accent"
                >
                  {{ item.badge }}
                </span>
              }
              <h3 class="text-base font-semibold text-gray-900 break-words">
                {{ item.title }}
              </h3>
              <p
                class="mt-1.5 text-sm text-gray-600 leading-relaxed break-words"
              >
                {{ item.description }}
              </p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        flex-direction: column;
      }
    `,
  ],
})
export class SlideGridComponent {
  readonly slide = input.required<Slide>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();

  /** Nombre d'items du grid courant. */
  readonly gridItemsCount = computed(
    (): number => this.slide().gridItems?.length ?? 0,
  );

  /**
   * Retourne true si l'item courant est le 3eme et dernier d'une grille de
   * 3 items. Permet de faire un span sur 2 colonnes en mode tablette pour
   * eviter une carte orpheline.
   */
  isLastOf3(index: number): boolean {
    return this.gridItemsCount() === 3 && index === 2;
  }
}
