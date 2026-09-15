import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { ActivatedRouteSnapshot } from '@angular/router';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AsiliBackgroundComponent } from './shared/components/asili-background/asili-background.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { CookieBannerComponent } from './shared/components/cookie-banner/cookie-banner.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SeoManagerComponent } from './shared/components/seo-manager.component';
import { SessionRetryComponent } from './shared/components/session-retry/session-retry.component';
import { SkipLinkComponent } from './shared/components/skip-link.component';

function porteLaCoquille(racine: ActivatedRouteSnapshot): boolean {
  let route = racine;
  while (route.firstChild) {
    route = route.firstChild;
  }
  return route.data['coquille'] !== false;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AsiliBackgroundComponent,
    NavbarComponent,
    SeoManagerComponent,
    FooterComponent,
    SkipLinkComponent,
    CookieBannerComponent,
    SessionRetryComponent,
  ],
  template: `
    @if (coquille()) {
      <app-asili-background />
    }
    <app-seo-manager></app-seo-manager>
    @if (coquille()) {
      <app-skip-link></app-skip-link>
    }
    <div [class.min-h-screen]="coquille()" [class.text-scheme-text]="coquille()">
      @if (coquille()) {
        <app-navbar></app-navbar>
      }
      <main id="main-content" role="main">
        <!-- Cale sous la navbar fixe : purement dimensionnelle, sans fond
             opaque qui masquerait le champ de particules global. -->
        @if (coquille()) {
          <div class="pt-24 lg:pt-28"></div>
        }
        <app-session-retry />
        <router-outlet></router-outlet>
      </main>
      <!--
        Footer rendu sans @defer pour qu'il soit inclus dans le HTML
        prerendu (SSR). Contient <address itemprop="PostalAddress"> et
        <time datetime> critiques pour SEO/AI-Search (P2.10/P2.11 +
        7 liens internal linking P2.12/P6.4). Le bundle footer est
        leger, le gain de defer serait < 1KB et casse le prerender.
      -->
      @if (coquille()) {
        <app-footer></app-footer>
        @defer (on idle) {
          <app-cookie-banner></app-cookie-banner>
        }
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
  title = 'portfolio-app';

  private readonly router = inject(Router);

  protected readonly coquille = toSignal(
    this.router.events.pipe(
      filter((evenement) => evenement instanceof NavigationEnd),
      map(() => porteLaCoquille(this.router.routerState.snapshot.root)),
    ),
    { initialValue: true },
  );
}
