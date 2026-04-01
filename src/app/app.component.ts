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
        <div class="pt-20 lg:pt-24 bg-scheme-background"></div>
        <router-outlet></router-outlet>
      </main>
      @defer (on viewport) {
        <app-footer></app-footer>
      } @placeholder {
        <div class="h-48"></div>
      }
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
