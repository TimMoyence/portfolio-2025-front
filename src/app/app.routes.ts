import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    data: {
      seo: {
        title: $localize`:route.home.seo.title|SEO title for home@@routeHomeSeoTitle:Accueil — Tim Moyence Portfolio`,
        description: $localize`:route.home.seo.description|SEO description for home@@routeHomeSeoDescription:Explore my professional services.`,
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
        title: $localize`:route.login.seo.title|SEO title for login@@routeLoginSeoTitle:Login — Pour acceder à votre compte`,
        description: $localize`:route.login.seo.description|SEO description for login@@routeLoginSeoDescription:You can't access this page without logging in.`,
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
        title: $localize`:route.register.seo.title|SEO title for register@@routeRegisterSeoTitle:Register — Pour acceder à votre compte`,
        description: $localize`:route.register.seo.description|SEO description for register@@routeRegisterSeoDescription:You can't access this page without registering.`,
        image: '/assets/og-services.jpg',
      },
    },
  },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
