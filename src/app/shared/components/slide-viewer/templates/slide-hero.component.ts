import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type { Slide } from "../../../models/slide.model";

/**
 * Template hero : image plein fond avec overlay gradient et titre centré.
 * Utilisé pour les slides d'accroche et de transition.
 */
@Component({
  selector: "app-slide-hero",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative min-h-full flex items-center justify-center text-center text-white overflow-hidden"
    >
      <!-- Background image -->
      @if (slide().imageUrl) {
        <div
          class="absolute inset-0 bg-cover bg-center"
          [style.backgroundImage]="'url(' + slide().imageUrl + ')'"
        ></div>
      }
      <!-- Overlay gradient -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20"
      ></div>

      <!-- Content -->
      <div class="relative z-10 px-6 py-16 max-w-4xl" data-aos="zoom-in">
        <h2
          data-slide-title
          class="font-heading text-h1 text-white leading-tight"
        >
          {{ slide().title }}
        </h2>
        @if (slide().subtitle) {
          <p class="mt-4 text-lg sm:text-xl text-white/80 leading-relaxed">
            {{ slide().subtitle }}
          </p>
        }
      </div>
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
export class SlideHeroComponent {
  readonly slide = input.required<Slide>();
}
