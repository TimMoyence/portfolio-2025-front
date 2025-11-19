import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SvgIconComponent } from './svg-icon.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, SvgIconComponent],
  template: `
    <nav
      class="fixed top-0 left-0 right-0 z-50 py-4 px-6 transition-all duration-300"
      [ngClass]="{ 'py-2': scrolled }"
    >
      <div
        class="glass-card-dark bg-scheme-background  flex items-center justify-between py-3 px-6 rounded-full max-w-7xl mx-auto transition-all duration-300"
        [ngClass]="{ 'shadow-lg': scrolled }"
      >
        <div class=" font-bold text-xl">
          <a routerLink="/" class="flex items-center gap-2">
            <span class="text-2xl">Portfolio</span>
          </a>
        </div>

        <div class="hidden md:flex items-center gap-6">
          <a
            *ngFor="let item of navItems; let i = index"
            [routerLink]="item.path"
            routerLinkActive=" font-medium"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class=" hover: transition-colors duration-300"
            [ngClass]="'delay-' + (i + 1) + '00'"
          >
            {{ item.label }}
          </a>
          <div>
            <p
              role="button"
              (click)="toggleMobileMenu('MenuOpen')"
              class="flex w-full items-center justify-between text-left text-regular "
            >
              Sandbox

              <app-svg-icon
                name="chevron-down"
                class="text-mm-light"
                [size]="1.7"
              ></app-svg-icon>
            </p>
            @if(MenuOpen){
            <div
              data-slot="card"
              class="z-50 overflow-hidden rounded-card border border-scheme-border bg-scheme-background text-scheme-text lg:absolute lg:w-80 lg:border lg:p-6 lg:[--y-close:25%]"
            >
              <div
                class="grid grid-cols-1 grid-rows-[max-content] gap-y-2 py-3 md:py-3 lg:gap-y-4 lg:py-0"
              >
                <a
                  href="#"
                  class="grid auto-cols-fr grid-cols-[max-content_1fr] items-start gap-x-3 py-2 lg:py-1"
                >
                  <div
                    class="flex size-6 flex-col items-center justify-center"
                  ></div>
                  <div class="flex flex-col items-start justify-center">
                    <p class="text-regular font-semibold">Page one</p>
                    <p class="text-small hidden md:block">
                      Lorem ipsum dolor sit amet consectetur elit
                    </p>
                  </div>
                </a>
                <a
                  href="#"
                  class="grid auto-cols-fr grid-cols-[max-content_1fr] items-start gap-x-3 py-2 lg:py-1"
                >
                  <div
                    class="flex size-6 flex-col items-center justify-center"
                  ></div>
                  <div class="flex flex-col items-start justify-center">
                    <p class="text-regular font-semibold">Page two</p>
                    <p class="text-small hidden md:block">
                      Lorem ipsum dolor sit amet consectetur elit
                    </p>
                  </div>
                </a>
                <a
                  href="#"
                  class="grid auto-cols-fr grid-cols-[max-content_1fr] items-start gap-x-3 py-2 lg:py-1"
                >
                  <div></div>
                  <div class="flex flex-col items-start justify-center">
                    <p class="text-regular font-semibold">Page three</p>
                    <p class="text-small hidden md:block">
                      Lorem ipsum dolor sit amet consectetur elit
                    </p>
                  </div>
                </a>
                <a
                  href="#"
                  class="grid auto-cols-fr grid-cols-[max-content_1fr] items-start gap-x-3 py-2 lg:py-1"
                >
                  <div></div>
                  <div class="flex flex-col items-start justify-center">
                    <p class="text-regular font-semibold">Page four</p>
                    <p class="text-small hidden md:block">
                      Lorem ipsum dolor sit amet consectetur elit
                    </p>
                  </div>
                </a>
              </div>
            </div>
            }
          </div>
          <a href="/contact">
            <button
              data-slot="button"
              class="bg-scheme-accent  inline-flex items-center justify-center gap-3 rounded-button whitespace-nowrap transition-all duration-200 ease-in-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border border-scheme-border text-scheme-text px-5 py-2 scheme-accent"
              title="Button"
            >
              Contact
            </button>
          </a>
        </div>

        <button (click)="toggleMobileMenu('mobileMenuOpen')" class="md:hidden ">
          <span *ngIf="!mobileMenuOpen">☰</span>
          <span *ngIf="mobileMenuOpen">✕</span>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div
        *ngIf="mobileMenuOpen"
        class="md:hidden absolute top-full left-0 right-0 p-4 fade-in"
      >
        <div class="glass-card-dark rounded-xl p-4 mt-2 flex flex-col">
          <a
            *ngFor="let item of navItems; let i = index"
            [routerLink]="item.path"
            routerLinkActive=" font-medium"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class=" hover: py-3 px-4 transition-colors duration-300"
            (click)="mobileMenuOpen = false"
          >
            {{ item.label }}
          </a>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class NavbarComponent {
  navItems = [
    { label: 'Home', path: '/', exact: true },
    { label: 'Projects', path: '/projects', exact: false },
    { label: 'Courses', path: '/courses', exact: false },
    { label: 'Services', path: '/services', exact: false },
  ];

  scrolled = false;
  mobileMenuOpen = false;
  MenuOpen = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 50;
  }

  toggleMobileMenu(MenuParam: string) {
    if ((MenuParam = 'MenuOpen')) this.MenuOpen = !this.MenuOpen;
    if ((MenuParam = 'mobileMenuOpen'))
      this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}
