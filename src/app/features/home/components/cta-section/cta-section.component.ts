import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="px-[5%] py-16 md:py-24 lg:py-28">
      <div class="container">
        <div
          class="grid auto-cols-fr grid-cols-1 overflow-hidden rounded-2xl border border-scheme-border bg-scheme-background lg:grid-cols-2"
        >
          <div class="flex flex-col justify-center p-8 md:p-12">
            <div>
              <h2 class="heading-h2 mb-5 font-bold md:mb-6">
                Commençons votre projet digital
              </h2>
              <p class="text-medium">
                Ensemble, transformons vos idées en solutions numériques
                performantes et innovantes.
              </p>
            </div>
            <div class="mt-6 flex flex-wrap items-center gap-4 md:mt-8">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-button bg-scheme-accent px-5 py-2 font-semibold text-scheme-text"
              >
                Démarrer
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-button border border-scheme-border px-5 py-2 font-semibold"
              >
                Contactez-moi
              </button>
            </div>
          </div>
          <div class="flex items-center justify-center">
            <img
              src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape4x3.svg"
              class="w-full object-cover"
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
export class CtaSectionComponent {}
