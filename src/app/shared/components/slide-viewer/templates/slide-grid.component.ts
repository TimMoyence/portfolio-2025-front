import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type { Slide } from "../../../models/slide.model";

/**
 * Template grid : titre centré suivi d'une grille responsive de cartes.
 * Chaque carte affiche un titre, une description et un badge optionnel.
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
          @for (item of slide().gridItems; track $index) {
            <div
              class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              data-aos="fade-up"
              [attr.data-aos-delay]="$index * 100"
            >
              @if (item.badge) {
                <span
                  class="inline-block mb-3 rounded-full bg-scheme-accent/10 px-3 py-1 text-[11px] font-semibold text-scheme-accent"
                >
                  {{ item.badge }}
                </span>
              }
              <h3 class="text-base font-semibold text-gray-900">
                {{ item.title }}
              </h3>
              <p class="mt-1.5 text-sm text-gray-600 leading-relaxed">
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
        display: block;
      }
    `,
  ],
})
export class SlideGridComponent {
  readonly slide = input.required<Slide>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();
}
