import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav
      class="fixed top-0 left-0 right-0 z-50 py-4 px-6 transition-all duration-300"
      [ngClass]="{ 'py-2': scrolled }"
    >
      <div
        class="glass-card-dark flex items-center justify-between py-3 px-6 rounded-full max-w-7xl mx-auto transition-all duration-300"
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
        </div>

        <button (click)="toggleMobileMenu()" class="md:hidden ">
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
    { label: 'Sandbox', path: '/sandbox', exact: false },
    { label: 'Services', path: '/services', exact: false },
    { label: 'Contact', path: '/contact', exact: false },
  ];

  scrolled = false;
  mobileMenuOpen = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 50;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}
