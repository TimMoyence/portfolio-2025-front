import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { SvgIconComponent } from "../../../../shared/components/svg-icon.component";

@Component({
  selector: "app-mission-section",
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  template: `
    <section
      class="bg-scheme-background px-[5%] py-12 md:py-18 lg:py-22"
      aria-labelledby="presQ-heading"
    >
      <div class="container">
        <div
          class="grid grid-cols-1 gap-y-12 md:grid-cols-2 md:items-center md:gap-x-12 lg:gap-x-20"
        >
          <div class="order-2 md:order-1">
            <img
              src="/assets/images/why-asili.webp"
              class="w-full shadow-xl overflow-hidden rounded-image object-cover"
              alt="Illustration expliquant pourquoi Asili"
              i18n-alt="
                mission.imageAlt|Mission illustration alt@@missionImageAlt"
              loading="lazy"
              aria-hidden="true"
            />
          </div>
          <div class="order-1 lg:order-2">
            <p
              class="mb-3 font-semibold md:mb-4"
              i18n="mission.kicker|Section label@@missionKicker"
            >
              Mission
            </p>
            <h3
              id="presQ-heading"
              class="font-heading heading-h3 text-h3 mb-5 md:mb-6"
              i18n="mission.title|Section heading@@missionTitle"
            >
              Pourquoi Asili ? Pourquoi cette approche ?
            </h3>
            <p
              class="text-sm"
              i18n="mission.lead|Section description@@missionLead"
            >
              Le digital et l’intelligence artificielle sont des leviers
              puissants, mais mal utilisés, ils créent souvent plus de
              complexité que de valeur.
            </p>
            <p
              class="pt-2 md:pt-3 lg:pt-4 text-sm"
              i18n="mission.lead|Section description@@missionLead2"
            >
              Mon rôle est d’aider à clarifier les besoins, à structurer les
              usageset à mettre en place des solutions compréhensibles, adaptées
              à la réalité terrain et pensées pour durer.
            </p>
            <div class="mt-6 text-xs flex md:mt-8">
              <a
                routerLink="/contact"
                class="inline-flex items-center justify-center gap-2  py-2 font-semibold underline"
                i18n="hero.cta.contact|Hero contact CTA@@heroCtaContact"
              >
                Échanger sur votre contexte
                <app-svg-icon
                  [name]="'chevron-right'"
                  [size]="1.2"
                  aria-hidden="true"
                ></app-svg-icon>
              </a>
            </div>
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
export class MissionSectionComponent {}
