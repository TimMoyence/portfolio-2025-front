import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { ActivatedRouteSnapshot } from '@angular/router';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AdresseAVerifierComponent } from './shared/components/auth/adresse-a-verifier/adresse-a-verifier.component';
import { FooterComponent } from './shared/components/cadre/footer/footer.component';
import { CookieBannerComponent } from './shared/components/cadre/cookie-banner/cookie-banner.component';
import { NavbarComponent } from './shared/components/cadre/navbar/navbar.component';
import { SeoManagerComponent } from './shared/components/seo-manager.component';
import { SessionRetryComponent } from './shared/components/auth/session-retry/session-retry.component';
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
    NavbarComponent,
    SeoManagerComponent,
    FooterComponent,
    SkipLinkComponent,
    CookieBannerComponent,
    SessionRetryComponent,
    AdresseAVerifierComponent,
  ],
  template: `
    <app-seo-manager></app-seo-manager>
    @if (coquille()) {
      <app-skip-link></app-skip-link>
    }
    <div [class.min-h-screen]="coquille()" [class.text-scheme-text]="coquille()">
      @if (coquille()) {
        <app-navbar></app-navbar>
      }
      <main id="main-content" role="main" tabindex="-1">
        @if (coquille()) {
          <div class="pt-24 lg:pt-28"></div>
          <app-adresse-a-verifier />
        }
        <app-session-retry />
        <router-outlet></router-outlet>
      </main>
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

      main:focus-visible {
        outline: none;
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
