import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SvgIconComponent } from '../../../../shared/components/svg-icon.component';

@Component({
  selector: 'app-mission-section',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  template: `
    <section
      class="px-[5%] py-16 md:py-24 lg:py-28"
      aria-labelledby="presQ-heading"
    >
      <div class="container">
        <div
          class="grid grid-cols-1 gap-y-12 md:grid-cols-2 md:items-center md:gap-x-12 lg:gap-x-20"
        >
          <div class="order-2 md:order-1">
            <img
              src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg"
              class="w-full rounded-image object-cover"
              alt="Relume placeholder image"
              loading="lazy"
              aria-hidden="true"
            />
          </div>
          <div class="order-1 lg:order-2">
            <p class="mb-3 font-semibold md:mb-4">Mission</p>
            <h2 id="presQ-heading" class="heading-h2 mb-5 font-bold md:mb-6">
              PresQ la marque qui transforme l'échec en opportunité
            </h2>
            <p class="text-medium">
              Une approche innovante qui démystifie l'échec et le transforme en
              source de croissance personnelle. Nous créons des expériences qui
              encouragent la résilience et l'apprentissage à travers l'humour et
              la bienveillance.
            </p>
            <div class="mt-6 flex flex-wrap gap-4 md:mt-8">
              <a
                href="/offres-et-tarifs"
                class="inline-flex items-center justify-center rounded-button border border-scheme-border px-5 py-2 font-semibold"
              >
                En savoir PresQ plus..
              </a>
              <a
                href="/questionnaire"
                class="inline-flex items-center justify-center gap-2 px-5 py-2 font-semibold underline"
              >
                Voter son PresQ modèle
                <app-svg-icon
                  aria-hidden="true"
                  name="chevron-right"
                  [size]="1.2"
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
