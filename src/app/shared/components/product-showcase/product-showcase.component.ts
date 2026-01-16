import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SvgIconComponent } from '../svg-icon.component';

@Component({
  selector: 'app-product-showcase',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  template: `
    <section
      class="px-[5%] py-12 md:py-18 lg:py-22"
      aria-labelledby="sebastian-heading"
    >
      <div class="container">
        <div
          class="grid grid-cols-1 gap-y-12 md:grid-cols-2 md:items-center md:gap-x-12 lg:gap-x-20"
        >
          <div>
            <p
              class="mb-3 font-semibold md:mb-4"
              i18n="productShowcase.kicker|Section label@@productShowcaseKicker"
            >
              Sebastian
            </p>
            <h2
              id="sebastian-heading"
              class="font-heading heading-h2 mb-5 font-bold md:mb-6"
              i18n="productShowcase.title|Section heading@@productShowcaseTitle"
            >
              Votre assistant personnel de suivi de consommation
            </h2>
            <p
              class="text-medium mb-5 md:mb-6"
              i18n="
                productShowcase.lead|Section description@@productShowcaseLead"
            >
              Une application conçue pour vous aider à comprendre et gérer vos
              habitudes de consommation avec des statistiques précises et des
              conseils personnalisés.
            </p>
            <ul class="my-4 list-disc pl-5">
              @for (feature of features; track $index) {
              <li class="my-1 self-start pl-2">
                {{ feature }}
              </li>
              }
            </ul>
            <div class="mt-6 flex flex-wrap items-center gap-4 md:mt-8">
              <a
                href="/register"
                class="inline-flex items-center justify-center rounded-button border border-scheme-border px-5 py-2 font-semibold"
                i18n="
                  productShowcase.cta.test|CTA label to test
                  consumption@@productShowcaseCtaTest"
              >
                Tester ma consommation
              </a>
              <a
                href="/sebastian"
                class="inline-flex items-center justify-center gap-2 px-5 py-2 font-semibold underline"
                i18n="
                  productShowcase.cta.learnMore|CTA label learn
                  more@@productShowcaseCtaLearnMore"
              >
                En savoir plus
                <app-svg-icon
                  name="chevron-right"
                  [size]="1.2"
                  aria-hidden="true"
                ></app-svg-icon>
              </a>
            </div>
          </div>
          <div>
            <img
              src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg"
              class="w-full rounded-image object-cover"
              alt="Relume placeholder image"
              i18n-alt="
                productShowcase.imageAlt|Product illustration
                alt@@productShowcaseImageAlt"
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
export class ProductShowcaseComponent {
  readonly features = [
    $localize`:productShowcase.feature.coffee|Feature bullet@@productShowcaseFeatureCoffee:Suivi de café`,
    $localize`:productShowcase.feature.alcohol|Feature bullet@@productShowcaseFeatureAlcohol:Analyse d'alcool`,
    $localize`:productShowcase.feature.goals|Feature bullet@@productShowcaseFeatureGoals:Objectifs personnalisés`,
  ];
}
