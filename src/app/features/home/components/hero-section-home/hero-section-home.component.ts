import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SvgIconComponent } from "../../../../shared/components/svg-icon.component";

@Component({
  selector: "app-hero-section-home",
  standalone: true,
  imports: [CommonModule, SvgIconComponent, RouterModule],
  template: `
    <section class="bg-scheme-background px-[5%] pb-12 md:pb-18 lg:pb-22">
      <div class="container">
        <div class="flex flex-col items-center">
          <div class="mb-4 text-center md:mb-8 lg:mb-12">
            <div class="w-full sm:px-6 md:px-10 lg:px-16">
              <p
                class="mb-3 font-semibold md:mb-4"
                i18n="hero.kicker|Hero small label@@heroKicker"
              >
                Innovation
              </p>
              <h1
                class="font-heading md:heading-h2 md:text-h2 heading-h3 text-h3 mb-5 md:mb-6"
                i18n="hero.title|Hero heading@@heroTitle"
              >
                Des solutions digitales claires, pensées pour votre réalité
                métier
              </h1>
              <p
                class="text-xs md:text-base lg:text-medium"
                i18n="hero.lead|Hero description@@heroLead"
              >
                J’accompagne entreprises et indépendants dans la clarification,
                la structuration et l’évolution de leurs outils digitaux, avec
                une approche sobre, progressive et adaptée aux usages réels.
              </p>
              <div
                class="  text-xs md:text-base lg:text-medium mt-4 flex flex-wrap items-center justify-center gap-2 md:mt-8 lg:mt-12"
              >
                <a
                  [routerLink]="'/presentations'"
                  class="transition-colors hover:bg-scheme-accent-hover active:bg-scheme-accent-active focus:outline-none focus:ring-4 focus:ring-scheme-accent-focus hidden md:inline-flex items-center justify-center rounded-button border border-scheme-border small px-5 py-2"
                  i18n="hero.cta.about|Hero about CTA@@heroCtaAbout"
                >
                  Découvrir l’approche
                </a>
                <a
                  [routerLink]="'/contact'"
                  class="hover:text-scheme-accent-hover focus:outline-none
                  focus:ring-4 focus:ring-scheme-accent-focus transition-colors inline-flex items-center justify-center gap-2 px-5 py-2 font-semibold underline"
                  i18n="hero.cta.contact|Hero contact CTA@@heroCtaContact"
                >
                  Échanger sur votre contexte
                  <app-svg-icon
                    name="chevron-right"
                    [size]="1.2"
                    aria-hidden="true"
                  ></app-svg-icon>
                </a>
              </div>
            </div>
          </div>
          <div>
            <img
              src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg"
              class="size-full rounded-image object-cover"
              alt="Portrait de Tim, développeur web chez Asili Design"
              i18n-alt="hero.imageAlt|Hero portrait alt text@@heroImageAlt"
              loading="lazy"
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
export class HeroSectionComponent {}
