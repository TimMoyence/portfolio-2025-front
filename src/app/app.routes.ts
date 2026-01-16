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
  {
    path: 'presentation',
    loadComponent: () =>
      import('./features/presentation/presentation.component').then(
        (m) => m.PresentationComponent,
      ),
    data: {
      seo: {
        title: $localize`:route.presentation.seo.title|SEO title for presentation@@routePresentationSeoTitle:Présentation — Tim Moyence Portfolio`,
        description: $localize`:route.presentation.seo.description|SEO description for presentation@@routePresentationSeoDescription:Découvrez mon parcours et mes compétences en développement web.`,
        image: '/assets/og-services.jpg',
      },
    },
  },
  {
    path: 'offer',
    loadComponent: () =>
      import('./features/offer/offer.component').then((m) => m.OfferComponent),
    data: {
      seo: {
        title: $localize`:route.offer.seo.title|SEO title for offer@@routeOfferSeoTitle:Offres — Services professionnels web`,
        description: $localize`:route.offer.seo.description|SEO description for offer@@routeOfferSeoDescription:Solutions numériques sur mesure et plans tarifaires.`,
        image: '/assets/og-services.jpg',
      },
    },
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact.component').then(
        (m) => m.ContactComponent,
      ),
    data: {
      seo: {
        title: $localize`:route.contact.seo.title|SEO title for contact@@routeContactSeoTitle:Contact — Échanges et devis`,
        description: $localize`:route.contact.seo.description|SEO description for contact@@routeContactSeoDescription:Prenez contact pour discuter de vos projets numériques.`,
        image: '/assets/og-services.jpg',
      },
    },
  },
  {
    path: 'client-project',
    loadComponent: () =>
      import('./features/client-project/client-project.component').then(
        (m) => m.ClientProjectComponent,
      ),
    data: {
      seo: {
        title: $localize`:route.clientProject.seo.title|SEO title for client projects@@routeClientProjectSeoTitle:Projets clients — Réalisations web`,
        description: $localize`:route.clientProject.seo.description|SEO description for client projects@@routeClientProjectSeoDescription:Découvrez une sélection de projets clients réalisés.`,
        image: '/assets/og-services.jpg',
      },
    },
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
    data: {
      seo: {
        title: $localize`:route.notFound.seo.title|SEO title for 404@@routeNotFoundSeoTitle:Page introuvable`,
        description: $localize`:route.notFound.seo.description|SEO description for 404@@routeNotFoundSeoDescription:La page demandée est introuvable.`,
        image: '/assets/og-services.jpg',
      },
    },
  },
];
