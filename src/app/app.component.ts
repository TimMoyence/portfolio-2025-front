import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './shared/components/footer/footer.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SeoManagerComponent } from './shared/components/seo-manager.component';
import { SkipLinkComponent } from './shared/components/skip-link.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    SeoManagerComponent,
    FooterComponent,
    SkipLinkComponent,
  ],
  template: `
    <app-seo-manager></app-seo-manager>
    <app-skip-link></app-skip-link>
    <div class="min-h-screen text-scheme-text">
      <app-navbar></app-navbar>
      <main id="main-content" role="main">
        <div class="pt-32 lg:pt-36 bg-scheme-background"></div>
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
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
}
