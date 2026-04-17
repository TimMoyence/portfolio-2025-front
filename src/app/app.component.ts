import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { FooterComponent } from "./shared/components/footer/footer.component";
import { CookieBannerComponent } from "./shared/components/cookie-banner/cookie-banner.component";
import { NavbarComponent } from "./shared/components/navbar/navbar.component";
import { SeoManagerComponent } from "./shared/components/seo-manager.component";
import { SkipLinkComponent } from "./shared/components/skip-link.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    SeoManagerComponent,
    FooterComponent,
    SkipLinkComponent,
    CookieBannerComponent,
  ],
  template: `
    <app-seo-manager></app-seo-manager>
    <app-skip-link></app-skip-link>
    <div class="min-h-screen text-scheme-text">
      <app-navbar></app-navbar>
      <main id="main-content" role="main">
        <div class="pt-24 lg:pt-28 bg-scheme-background"></div>
        <router-outlet></router-outlet>
      </main>
      <!--
        Footer rendu sans @defer pour qu'il soit inclus dans le HTML
        prerendu (SSR). Contient <address itemprop="PostalAddress"> et
        <time datetime> critiques pour SEO/AI-Search (P2.10/P2.11 +
        7 liens internal linking P2.12/P6.4). Le bundle footer est
        leger, le gain de defer serait < 1KB et casse le prerender.
      -->
      <app-footer></app-footer>
      @defer (on idle) {
        <app-cookie-banner></app-cookie-banner>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = "portfolio-app";
}
