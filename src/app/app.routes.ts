import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    data: {
      seoKey: 'home',
    },
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
