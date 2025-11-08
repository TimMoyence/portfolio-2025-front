import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar.component';
import { SeoManagerComponent } from './shared/components/seo-manager.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SeoManagerComponent],
  template: `
    <app-seo-manager></app-seo-manager>
    <div class="min-h-screen flex flex-col">
      <app-navbar></app-navbar>
      <main class="flex-grow">
        <section class="min-h-screen py-20">
          <router-outlet></router-outlet>
        </section>
      </main>
      <footer class="py-6 px-4 backdrop-blur-lg bg-black/20  text-center">
        <div class="container mx-auto">
          <p>© {{ currentYear }} Portfolio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class AppComponent {
  title = 'portfolio-app';
  currentYear = new Date().getFullYear();
}
