import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { APP_CONFIG } from "../../../../core/config/app-config.token";
import type { Slide } from "../../../models/slide.model";
import { QrCodeComponent } from "../../qr-code/qr-code.component";
import { ToolkitFormComponent } from "../../toolkit-form/toolkit-form.component";

/**
 * Template CTA : formulaire lead magnet inline + QR code stylise.
 * Remplace l'ancien bouton "Contactez-moi" par une capture de leads.
 */
@Component({
  selector: "app-slide-cta",
  standalone: true,
  imports: [RouterModule, QrCodeComponent, ToolkitFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative flex-1 flex items-center justify-center overflow-hidden bg-white"
    >
      <div class="relative z-10 px-6 py-16 max-w-3xl mx-auto">
        <div class="text-center mb-10">
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
        </div>

        <div
          class="flex flex-col md:flex-row items-center gap-10 justify-center"
        >
          <!-- Formulaire -->
          <div class="w-full max-w-sm">
            <app-toolkit-form />
          </div>

          <!-- QR Code -->
          <div class="flex flex-col items-center gap-3">
            <app-qr-code [data]="toolkitUrl" [size]="180" color="#4fb3a2" />
            <p class="text-xs text-scheme-text-muted">Ou scannez</p>
          </div>
        </div>

        <p class="mt-8 text-center text-sm text-scheme-text-muted">
          Des questions ?
          <a
            routerLink="/contact"
            class="text-scheme-accent underline hover:text-scheme-accent-hover"
          >
            Contactez-moi
          </a>
        </p>
      </div>

      @if (slide().image) {
        <img
          [src]="slide().image"
          [alt]="slide().imageAlt || ''"
          class="absolute bottom-4 right-4 w-[25rem] h-[25rem] object-contain opacity-90 pointer-events-none hidden lg:block"
          loading="lazy"
        />
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        flex-direction: column;
      }
    `,
  ],
})
export class SlideCtaComponent {
  readonly slide = input.required<Slide>();
  private readonly config = inject(APP_CONFIG);

  readonly toolkitUrl = `${this.config.baseUrl}/formations/ia-solopreneurs/toolkit`;
}
