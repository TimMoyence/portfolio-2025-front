import { Component } from '@angular/core';
import { SvgIconComponent } from '../svg-icon.component';

@Component({
  selector: 'app-footer',
  imports: [SvgIconComponent],
  template: `
    <footer class="px-[5%] py-12 md:py-18 lg:py-20">
      <div class="container">
        <div
          class="grid grid-cols-1 gap-x-[4vw] gap-y-12 pb-12 md:gap-y-16 md:pb-18 lg:grid-cols-[1fr_0.5fr] lg:gap-y-4 lg:pb-20"
        >
          <div>
            <div class="mb-6 md:mb-8">
              <a href="#">
                <app-svg-icon
                  name="logo-image"
                  class="inline-block text-neutral-darkest"
                  [width]="4.375"
                  [height]="2.25"
                  aria-label="Logo image"
                ></app-svg-icon>
              </a>
            </div>
            <div class="mb-6 md:mb-8">
              <p class="text-small mb-1 font-semibold">Address:</p>
              <p class="text-small mb-5 md:mb-6">
                Level 1, 12 Sample St, Sydney NSW 2000
              </p>
              <p class="text-small mb-1 font-semibold">Contact:</p>
              <a href="tel:18001234567" class="text-small block underline">
                1800 123 4567
              </a>
              <a
                href="mailto:info&#64;relume.io"
                class="text-small block underline"
              >
                info&#64;eelume.io
              </a>
            </div>
            <div
              class="grid grid-flow-col grid-cols-[max-content] items-start justify-start gap-x-3"
            >
              <a href="#">
                <app-svg-icon
                  name="facebook"
                  class="size-6 text-scheme-text"
                  [size]="1.5"
                  aria-label="Facebook"
                ></app-svg-icon>
              </a>
              <a href="#">
                <app-svg-icon
                  name="instagram"
                  class="size-6 text-scheme-text"
                  [size]="1.5"
                  aria-label="Instagram"
                ></app-svg-icon>
              </a>
              <a href="#">
                <app-svg-icon
                  name="linkedin"
                  class="size-6 text-scheme-text"
                  [size]="1.5"
                  aria-label="LinkedIn"
                ></app-svg-icon>
              </a>
              <a href="#">
                <app-svg-icon
                  name="youtube"
                  class="size-6 text-scheme-text"
                  [size]="1.5"
                  aria-label="YouTube "
                ></app-svg-icon>
              </a>
            </div>
          </div>
          <div
            class="grid grid-cols-1 items-start gap-x-6 gap-y-10 md:grid-cols-2 md:gap-x-8 md:gap-y-4"
          >
            <ul>
              <li class="text-small py-2 font-semibold">
                <a href="#">Link One</a>
              </li>
              <li class="text-small py-2 font-semibold">
                <a href="#">Link Two</a>
              </li>
              <li class="text-small py-2 font-semibold">
                <a href="#">Link Three</a>
              </li>
              <li class="text-small py-2 font-semibold">
                <a href="#">Link Four</a>
              </li>
              <li class="text-small py-2 font-semibold">
                <a href="#">Link Five</a>
              </li>
            </ul>
            <ul>
              <li class="text-small py-2 font-semibold">
                <a href="#">Link Six</a>
              </li>
              <li class="text-small py-2 font-semibold">
                <a href="#">Link Seven</a>
              </li>
              <li class="text-small py-2 font-semibold">
                <a href="#">Link Eight</a>
              </li>
              <li class="text-small py-2 font-semibold">
                <a href="#">Link Nine</a>
              </li>
              <li class="text-small py-2 font-semibold">
                <a href="#">Link Ten</a>
              </li>
            </ul>
          </div>
        </div>
        <div class="h-px w-full bg-scheme-border"></div>
        <div
          class="text-small flex flex-col-reverse items-start justify-between pt-6 pb-4 md:flex-row md:items-center md:pt-8 md:pb-0"
        >
          <p class="mt-8 md:mt-0">© 2024 Relume. All rights reserved.</p>
          <ul
            class="text-small grid grid-flow-row grid-cols-[max-content] justify-center gap-y-4 md:grid-flow-col md:gap-x-6 md:gap-y-0"
          >
            <li class="underline"><a href="#">Privacy Policy</a></li>
            <li class="underline"><a href="#">Terms of Service</a></li>
            <li class="underline"><a href="#">Cookies Settings</a></li>
          </ul>
        </div>
      </div>
      <div
        class="absolute bottom-0 left-0 right-0 flex h-16 w-full items-center justify-center md:h-18"
      >
        <p class="text-small">© 2024 Asili Design</p>
      </div>
    </footer>
  `,
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {}
