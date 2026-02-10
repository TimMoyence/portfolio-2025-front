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
          <div class="mb-2 text-center md:mb-4 lg:mb-6">
            <div class="w-full  grid grid-cols-12 sm:px-6 md:px-10 lg:px-16">
              <p
                class="col-span-full mb-1 font-semibold md:mb-2"
                i18n="hero.kicker|Hero small label@@heroKicker"
              >
                Innovation
              </p>
              <h1
                class="col-span-full font-heading md:heading-h2 md:text-h2 heading-h3 text-h3 mb-1 md:mb-2"
                i18n="hero.title|Hero heading@@heroTitle"
              >
                Des solutions digitales claires, pensées pour votre réalité
                métier
              </h1>
              <p
                class="col-start-3 col-end-11 text-xs md:text-base lg:text-medium"
                i18n="hero.lead|Hero description@@heroLead"
              >
                J’accompagne entreprises et indépendants dans la clarification,
                la structuration et l’évolution de leurs outils digitaux, avec
                une approche sobre, progressive et adaptée aux usages réels.
              </p>
              <div
                class=" col-span-full text-xs md:text-base lg:text-medium mt-4 flex flex-wrap items-center justify-center gap-2 md:mt-8 lg:mt-12"
              >
                <a
                  [routerLink]="'/presentation'"
                  class="transition-colors bg-white hover:bg-scheme-accent active:bg-scheme-accent-active focus:outline-none focus:ring-4 focus:ring-scheme-accent-focus hidden md:inline-flex items-center justify-center rounded-button border border-scheme-border small px-5 py-2"
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
              src="./assets/images/portrait-tim-asili-design.webp"
              class="shadow-xl overflow-hidden rounded-image size-full h-[15rem] md:h-[20rem] lg:h-[30rem] object-cover"
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
