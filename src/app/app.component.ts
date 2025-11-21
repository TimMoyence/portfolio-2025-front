import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './shared/components/footer/footer.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SeoManagerComponent } from './shared/components/seo-manager.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    SeoManagerComponent,
    FooterComponent,
  ],
  template: `
    <app-seo-manager></app-seo-manager>
    <div class="min-h-screen text-scheme-text">
      <app-navbar></app-navbar>
      <main class="pt-24 md:pt-28 lg:pt-32">
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
