import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    data: {
      seoKey: 'home',
    },
  },
  {
    path: 'home',
    pathMatch: 'full',
    redirectTo: '',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent),
    data: {
      seoKey: 'login',
    },
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent),
    data: {
      seoKey: 'register',
    },
  },
  {
    path: 'presentation',
    loadComponent: () =>
      import('./features/presentation/presentation.component').then(
        (m) => m.PresentationComponent,
      ),
    data: {
      seoKey: 'presentation',
    },
  },
  {
    path: 'offer',
    loadComponent: () =>
      import('./features/offer/offer.component').then((m) => m.OfferComponent),
    data: {
      seoKey: 'offer',
    },
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact.component').then(
        (m) => m.ContactComponent,
      ),
    data: {
      seoKey: 'contact',
    },
  },
  {
    path: 'client-project',
    loadComponent: () =>
      import('./features/client-project/client-project.component').then(
        (m) => m.ClientProjectComponent,
      ),
    data: {
      seoKey: 'client-project',
    },
  },
  {
    path: 'cookie-settings',
    loadComponent: () =>
      import('./features/cookie-settings/cookie-settings.component').then(
        (m) => m.CookieSettingsComponent,
      ),
    data: {
      seoKey: 'cookie-settings',
    },
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./features/terms/terms.component').then(
        (m) => m.TermsComponent,
      ),
    data: {
      seoKey: 'terms',
    },
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./features/privacy/privacy.component').then(
        (m) => m.PrivacyComponent,
      ),
    data: {
      seoKey: 'privacy',
    },
  },
  {
    path: 'growth-audit',
    loadComponent: () =>
      import('./features/growth-audit/growth-audit.component').then(
        (m) => m.GrowthAuditComponent,
      ),
    data: {
      seoKey: 'growth-audit',
    },
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
    data: {
      seoKey: 'not-found',
    },
  },
];
