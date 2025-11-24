import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SvgIconComponent } from '../../../../shared/components/svg-icon.component';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  template: `
    <section class="px-[5%] pb-16 md:pb-24 lg:pb-28">
      <div class="container">
        <div class="flex flex-col items-center">
          <div class="mb-12 text-center md:mb-18 lg:mb-20">
            <div class="w-full max-w-lg">
              <p class="mb-3 font-semibold md:mb-4">Innovation</p>
              <h1 class="heading-h2 mb-5 font-bold md:mb-6">
                Bienvenue chez Asili Design
              </h1>
              <p class="text-medium">
                Je suis Tim, un professionnel qui transforme les défis
                numériques en opportunités. Mon parcours unique mêle
                développement web, management et enseignement.
              </p>
              <div
                class="mt-6 flex flex-wrap items-center justify-center gap-4 md:mt-8"
              >
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-button border border-scheme-border px-5 py-2 font-semibold"
                >
                  En savoir plus
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 px-5 py-2 font-semibold underline"
                >
                  Projets
                  <app-svg-icon
                    name="chevron-right"
                    [size]="1.2"
                  ></app-svg-icon>
                </button>
              </div>
            </div>
          </div>
          <div>
            <img
              src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg"
              class="size-full rounded-image object-cover"
              alt="Relume placeholder image"
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
