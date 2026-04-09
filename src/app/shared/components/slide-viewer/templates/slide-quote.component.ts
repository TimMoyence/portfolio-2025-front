import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type { Slide } from "../../../models/slide.model";

/**
 * Template quote : citation centrée avec guillemets décoratifs,
 * auteur en accent, et image de fond optionnelle avec overlay.
 */
@Component({
  selector: "app-slide-quote",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative min-h-full flex items-center justify-center overflow-hidden"
    >
      @if (slide().imageUrl) {
        <div
          class="absolute inset-0 bg-cover bg-center"
          [style.backgroundImage]="'url(' + slide().imageUrl + ')'"
        ></div>
        <div class="absolute inset-0 bg-white/85"></div>
      }

      <div
        class="relative z-10 px-6 py-16 text-center max-w-3xl mx-auto"
        data-aos="fade"
        data-aos-duration="1200"
      >
        <h2
          data-slide-title
          class="font-heading text-h4 sm:text-h3 text-gray-900 leading-tight mb-8"
        >
          {{ slide().title }}
        </h2>
        @if (slide().quote) {
          <div class="relative">
            <span
              class="absolute -top-8 -left-2 text-6xl text-scheme-accent/20 font-heading select-none"
              aria-hidden="true"
              >&laquo;</span
            >
            <blockquote
              class="text-2xl sm:text-3xl italic font-heading text-gray-900 leading-snug px-6"
            >
              {{ slide().quote }}
            </blockquote>
            <span
              class="absolute -bottom-8 -right-2 text-6xl text-scheme-accent/20 font-heading select-none"
              aria-hidden="true"
              >&raquo;</span
            >
          </div>
          @if (slide().quoteAuthor) {
            <p class="mt-8 text-base font-medium text-scheme-accent">
              {{ slide().quoteAuthor }}
            </p>
          }
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
export class SlideQuoteComponent {
  readonly slide = input.required<Slide>();
}
