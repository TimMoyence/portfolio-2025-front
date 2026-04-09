import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { Slide } from "../../../models/slide.model";

/**
 * Template CTA : mise en page centrée avec titre, sous-titre,
 * liste de fonctionnalités et bouton d'action principal.
 */
@Component({
  selector: "app-slide-cta",
  standalone: true,
  imports: [RouterModule],
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
        <div class="absolute inset-0 bg-white/90"></div>
      }

      <div class="relative z-10 px-6 py-16 text-center max-w-2xl mx-auto">
        <h2
          data-slide-title
          class="font-heading text-h2 text-gray-900 leading-tight"
        >
          {{ slide().title }}
        </h2>
        @if (slide().subtitle) {
          <p class="mt-3 text-lg text-gray-500 leading-relaxed">
            {{ slide().subtitle }}
          </p>
        }

        @if (slide().bullets && slide().bullets!.length > 0) {
          <ul class="mt-8 space-y-3 text-left max-w-md mx-auto">
            @for (bullet of slide().bullets; track $index) {
              <li
                class="flex items-start gap-3 text-[15px] text-gray-700 leading-relaxed"
              >
                <span
                  class="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-scheme-accent"
                  aria-hidden="true"
                ></span>
                <span>{{ bullet }}</span>
              </li>
            }
          </ul>
        }

        <div class="mt-10" data-aos="zoom-in">
          <a
            routerLink="/contact"
            class="inline-flex items-center gap-2 rounded-full bg-scheme-accent px-10 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:bg-scheme-accent-hover hover:shadow-xl active:scale-[0.98]"
            i18n
          >
            Contactez-moi
          </a>
        </div>
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
export class SlideCtaComponent {
  readonly slide = input.required<Slide>();
}
