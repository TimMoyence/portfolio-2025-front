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
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
