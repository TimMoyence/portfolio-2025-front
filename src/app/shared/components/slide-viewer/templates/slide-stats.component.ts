import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import type { Slide } from "../../../models/slide.model";

/**
 * Template stats : titre centré suivi d'une grille de cartes statistiques.
 * Chaque carte affiche un chiffre clé, un libellé et une source optionnelle.
 *
 * Le nombre de colonnes est responsive et derive du nombre de stats :
 * - 4 stats : 2 cols mobile, 4 cols desktop
 * - 3 stats : 1 col mobile, 2 cols tablette, 3 cols desktop
 * - 2 stats : 1 col mobile, 2 cols sm+
 * - autre : grille auto-fit avec un fallback raisonnable
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
          class="mt-8 grid gap-4 sm:gap-6 max-w-5xl mx-auto w-full"
          [class]="gridColsClass()"
        >
          @for (stat of slide().stats; track $index) {
            <div
              class="min-w-0 rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm"
              data-aos="fade-up"
              [attr.data-aos-delay]="$index * 100"
            >
              <div
                class="text-5xl font-heading text-scheme-accent mb-2 break-words"
              >
                {{ stat.value }}
              </div>
              <div class="text-sm text-gray-700 leading-snug break-words">
                {{ stat.label }}
              </div>
              @if (stat.source) {
                <div class="mt-2 text-[11px] text-gray-400 break-words">
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
        display: flex;
        flex: 1;
        flex-direction: column;
      }
    `,
  ],
})
export class SlideStatsComponent {
  readonly slide = input.required<Slide>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();

  /**
   * Classe Tailwind responsive pour la grille de stats.
   * Determinee a partir du nombre de stats du slide courant.
   */
  readonly gridColsClass = computed((): string => {
    const count = this.slide().stats?.length ?? 0;
    switch (count) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-2 lg:grid-cols-4";
      default:
        return "grid-cols-2 lg:grid-cols-3";
    }
  });
}
