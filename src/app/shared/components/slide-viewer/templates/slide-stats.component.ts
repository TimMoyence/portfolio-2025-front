import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type { Slide } from "../../../models/slide.model";

/**
 * Template stats : titre centré suivi d'une grille de cartes statistiques.
 * Chaque carte affiche un chiffre clé, un libellé et une source optionnelle.
 */
@Component({
  selector: "app-slide-stats",
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

      @if (slide().stats && slide().stats!.length > 0) {
        <div
          class="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto w-full"
        >
          @for (stat of slide().stats; track $index) {
            <div
              class="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm"
              data-aos="fade-up"
              [attr.data-aos-delay]="$index * 100"
            >
              <div class="text-5xl font-heading text-scheme-accent mb-2">
                {{ stat.value }}
              </div>
              <div class="text-sm text-gray-700 leading-snug">
                {{ stat.label }}
              </div>
              @if (stat.source) {
                <div class="mt-2 text-[11px] text-gray-400">
                  {{ stat.source }}
                </div>
              }
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
export class SlideStatsComponent {
  readonly slide = input.required<Slide>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();
}
