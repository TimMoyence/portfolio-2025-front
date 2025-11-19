import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    data: {
      seo: {
        title: 'Accueil — Tim Moyence Portfolio',
        description: 'Explore my professional services.',
        image: '/assets/og-services.jpg',
      },
    },
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent),
    data: {
      seo: {
        title: 'Login — Pour acceder à votre compte',
        description: "You can't access this page without logging in.",
        image: '/assets/og-services.jpg',
      },
    },
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent),
    data: {
      seo: {
        title: 'Register — Pour acceder à votre compte',
        description: "You can't access this page without registering.",
        image: '/assets/og-services.jpg',
      },
    },
  },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
