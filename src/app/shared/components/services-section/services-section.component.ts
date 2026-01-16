import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SvgIconComponent } from "../svg-icon.component";

export type ServiceItem = {
  title: string;
  description: string;
  iconSrc: string;
  iconAlt: string;
};

export type ServicesCta = {
  label: string;
  href: string; // routerLink ou lien simple
  iconName?: string; // ex: 'chevron-right'
  iconSize?: number; // default 1.2
};

@Component({
  selector: "app-services-section",
  standalone: true,
  imports: [CommonModule, RouterModule, SvgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="px-[5%] py-12 md:py-18 lg:py-22">
      <div class="container">
        <div
          class="mb-12 grid grid-cols-1 gap-5 md:mb-18 md:grid-cols-2 md:gap-x-12 md:gap-y-8 lg:mb-20 lg:gap-x-20"
        >
          <div>
            <p class="mb-3 font-semibold md:mb-4">
              {{ kicker }}
            </p>
            <h3 class="font-heading heading-h3 text-h3">
              {{ title }}
            </h3>
          </div>

          <div>
            @for (p of leadParagraphs; track $index) {
              <p class="text-small" [ngClass]="$index > 0 ? 'pt-2' : ''">
                {{ p }}
              </p>
            }
          </div>
        </div>

        <div
          class="flex row items-center justify-between md:flex-nowrap flex-wrap"
        >
          @for (service of services; track service.title) {
            <article class="m-2 md:m-3">
              <div class="mb-5 md:mb-6">
                <img
                  [src]="service.iconSrc"
                  class="size-12"
                  [alt]="service.iconAlt"
                  loading="lazy"
                  aria-hidden="true"
                />
              </div>
              <h3 class="heading-h5 mb-3 font-bold md:mb-4">
                {{ service.title }}
              </h3>
              <p>{{ service.description }}</p>
            </article>
          }
        </div>

        @if (cta) {
          <div
            class="mt-12 flex flex-wrap items-center gap-4 md:mt-18 lg:mt-20"
          >
            <a
              [routerLink]="cta.href"
              class="inline-flex items-center justify-center gap-2 px-5 py-2 font-semibold"
            >
              {{ cta.label }}
              @if (cta.iconName) {
                <app-svg-icon
                  [size]="1.2"
                  aria-hidden="true"
                  [name]="'chevron-right'"
                />
              }
            </a>
          </div>
        }
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
export class ServicesSectionComponent {
  @Input({ required: true }) kicker!: string;
  @Input({ required: true }) title!: string;

  /**
   * Permet d'avoir 1 ou plusieurs paragraphes (ton cas: 2 lignes)
   */
  @Input() leadParagraphs: string[] = [];

  @Input({ required: true }) services: ServiceItem[] = [];

  @Input() cta?: ServicesCta;
}
