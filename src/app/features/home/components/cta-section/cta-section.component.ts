import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

@Component({
  selector: "app-cta-section",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="px-[5%] py-12 md:py-18 lg:py-22">
      <div class="container" aria-labelledby="start-project-heading">
        <div
          class="shadow-xl overflow-hidden grid auto-cols-fr grid-cols-1 overflow-hidden rounded-2xl border border-scheme-border bg-scheme-background lg:grid-cols-2"
        >
          <div class="flex flex-col justify-center p-8 md:p-12">
            <div>
              <h3
                id="start-project-heading"
                class="font-heading heading-h3 text-h3 mb-5 font-bold md:mb-6"
                i18n="cta.title|CTA heading@@ctaTitle"
              >
                Parlons de votre projet
              </h3>
              <p class="text-medium" i18n="cta.lead|CTA description@@ctaLead">
                Un premier échange, sans engagement, pour comprendre votre
                contexte et vos priorités.
              </p>
            </div>
            <div class="mt-6 flex flex-wrap items-center gap-4 md:mt-8">
              <a
                href="/contact"
                class="inline-flex text-xs md:text-base items-center justify-center rounded-button
                bg-scheme-accent px-5 py-2
                font-semibold text-scheme-on-accent
                transition-colors
                hover:bg-scheme-accent-hover
                active:bg-scheme-accent-active
                focus:outline-none
                focus:ring-4 focus:ring-scheme-accent-focus"
                i18n="cta.cta.start|CTA primary button@@ctaPrimary"
              >
                Echanger sur votre contexte
              </a>
            </div>
          </div>
          <div class="flex items-center justify-center">
            <img
              src="./assets/images/letsTalkIllustration.webp"
              class="w-full object-cover"
              alt=" image of me smiling ready to discuss your project"
              i18n-alt="cta.image.alt|CTA illustration alt text@@ctaImageAlt"
              loading="lazy"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class CtaSectionComponent {}
