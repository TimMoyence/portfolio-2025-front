import type { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { redirectIfAuthorizedGuard } from "./core/guards/redirect-if-authorized.guard";
import { roleGuard } from "./core/guards/role.guard";
import { buildFormationRoutes } from "./features/formations/shared/formation-routes.factory";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./features/home/home.component").then((m) => m.HomeComponent),
    data: {
      seoKey: "home",
    },
  },
  {
    path: "home",
    pathMatch: "full",
    redirectTo: "",
  },
  {
    path: "login",
    loadComponent: () =>
      import("./features/auth/auth.component").then((m) => m.AuthComponent),
    data: {
      seoKey: "login",
    },
  },
  {
    path: "register",
    loadComponent: () =>
      import("./features/auth/auth.component").then((m) => m.AuthComponent),
    data: {
      seoKey: "register",
    },
  },
  {
    path: "forgot-password",
    loadComponent: () =>
      import("./features/auth/forgot-password.component").then(
        (m) => m.ForgotPasswordComponent,
      ),
    data: {
      seoKey: "forgot-password",
    },
  },
  {
    path: "reset-password",
    loadComponent: () =>
      import("./features/auth/reset-password.component").then(
        (m) => m.ResetPasswordComponent,
      ),
    data: {
      seoKey: "reset-password",
    },
  },
  {
    path: "verify-email",
    loadComponent: () =>
      import("./features/auth/verify-email.component").then(
        (m) => m.VerifyEmailComponent,
      ),
    data: {
      seoKey: "verify-email",
    },
  },
  {
    path: "profil",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/profile/profile.component").then(
        (m) => m.ProfileComponent,
      ),
    data: {
      seoKey: "profile",
    },
  },
  {
    path: "presentation",
    loadComponent: () =>
      import("./features/presentation/presentation.component").then(
        (m) => m.PresentationComponent,
      ),
    data: {
      seoKey: "presentation",
    },
  },
  {
    path: "offer",
    loadComponent: () =>
      import("./features/offer/offer.component").then((m) => m.OfferComponent),
    data: {
      seoKey: "offer",
    },
  },
  {
    path: "contact",
    loadComponent: () =>
      import("./features/contact/contact.component").then(
        (m) => m.ContactComponent,
      ),
    data: {
      seoKey: "contact",
    },
  },
  {
    path: "client-project",
    loadComponent: () =>
      import("./features/client-project/client-project.component").then(
        (m) => m.ClientProjectComponent,
      ),
    data: {
      seoKey: "client-project",
    },
  },
  {
    path: "cookie-settings",
    loadComponent: () =>
      import("./features/cookie-settings/cookie-settings.component").then(
        (m) => m.CookieSettingsComponent,
      ),
    data: {
      seoKey: "cookie-settings",
    },
  },
  {
    path: "terms",
    loadComponent: () =>
      import("./features/terms/terms.component").then((m) => m.TermsComponent),
    data: {
      seoKey: "terms",
    },
  },
  {
    path: "privacy",
    loadComponent: () =>
      import("./features/privacy/privacy.component").then(
        (m) => m.PrivacyComponent,
      ),
    data: {
      seoKey: "privacy",
    },
  },
  {
    path: "growth-audit",
    loadComponent: () =>
      import("./features/growth-audit/growth-audit.component").then(
        (m) => m.GrowthAuditComponent,
      ),
    data: {
      seoKey: "growth-audit",
    },
  },
  // Pages publiques de presentation des ateliers (indexables, marketing).
  // Affichent une marketing page invitant a s'inscrire / acceder a l'app.
  {
    path: "atelier/meteo",
    canActivate: [redirectIfAuthorizedGuard("weather")],
    loadComponent: () =>
      import("./features/weather/weather-presentation.component").then(
        (m) => m.WeatherPresentationComponent,
      ),
    data: {
      seoKey: "weather",
    },
  },
  {
    path: "atelier/budget",
    canActivate: [redirectIfAuthorizedGuard("budget")],
    loadComponent: () =>
      import("./features/budget/budget-presentation.component").then(
        (m) => m.BudgetPresentationComponent,
      ),
    data: {
      seoKey: "budget",
    },
  },
  {
    path: "atelier/sebastian",
    canActivate: [redirectIfAuthorizedGuard("sebastian")],
    loadComponent: () =>
      import("./features/sebastian/sebastian-presentation.component").then(
        (m) => m.SebastianPresentationComponent,
      ),
    data: {
      seoKey: "sebastian",
    },
  },

  // Apps reelles, protegees par auth + role. Non indexables.
  {
    path: "atelier/meteo/app",
    canActivate: [authGuard, roleGuard("weather")],
    loadComponent: () =>
      import("./features/weather/weather-app.component").then(
        (m) => m.WeatherAppComponent,
      ),
    data: {
      seoKey: "weather-app",
    },
  },
  {
    path: "atelier/budget/app",
    canActivate: [authGuard, roleGuard("budget")],
    loadComponent: () =>
      import("./features/common-budget-tm/common-budget-tm.component").then(
        (m) => m.CommonBudgetTmComponent,
      ),
    data: {
      seoKey: "budget-app",
    },
  },
  {
    path: "atelier/sebastian/app",
    canActivate: [authGuard, roleGuard("sebastian")],
    loadComponent: () =>
      import("./features/sebastian/sebastian-app.component").then(
        (m) => m.SebastianAppComponent,
      ),
    data: {
      seoKey: "sebastian-app",
    },
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/sebastian/pages/sebastian-dashboard.component").then(
            (m) => m.SebastianDashboardComponent,
          ),
      },
      {
        path: "rapports",
        loadComponent: () =>
          import("./features/sebastian/pages/sebastian-reports.component").then(
            (m) => m.SebastianReportsComponent,
          ),
      },
      {
        path: "badges",
        loadComponent: () =>
          import("./features/sebastian/pages/sebastian-badges.component").then(
            (m) => m.SebastianBadgesComponent,
          ),
      },
      {
        path: "historique",
        loadComponent: () =>
          import("./features/sebastian/pages/sebastian-history.component").then(
            (m) => m.SebastianHistoryComponent,
          ),
      },
      {
        path: "objectifs",
        loadComponent: () =>
          import("./features/sebastian/pages/sebastian-goals.component").then(
            (m) => m.SebastianGoalsComponent,
          ),
      },
    ],
  },
  {
    path: "commonbudgetTM",
    redirectTo: "atelier/budget/app",
    pathMatch: "full" as const,
  },
  {
    path: "formations",
    loadComponent: () =>
      import("./features/formations/formations-list.component").then(
        (m) => m.FormationsListComponent,
      ),
    data: {
      seoKey: "formations",
    },
  },
  // Routes specifiques toolkit — declarees AVANT `formations/:slug` pour
  // prioriser le matching Angular Router (plus specifique d'abord).
  {
    path: "formations/ia-solopreneurs/toolkit/:token",
    loadComponent: () =>
      import("./features/formations/ia-solopreneurs/toolkit-private/toolkit-private.component").then(
        (m) => m.ToolkitPrivateComponent,
      ),
    data: {
      seoKey: "formations-ia-solopreneurs-toolkit-private",
    },
  },
  {
    path: "formations/ia-solopreneurs/toolkit",
    loadComponent: () =>
      import("./features/formations/ia-solopreneurs/toolkit/toolkit.component").then(
        (m) => m.ToolkitComponent,
      ),
    data: {
      seoKey: "formations-ia-solopreneurs-toolkit",
    },
  },
  {
    path: "formations/automatiser-avec-ia/toolkit",
    loadComponent: () =>
      import("./features/formations/automatiser-avec-ia/toolkit/toolkit-auto.component").then(
        (m) => m.ToolkitAutoComponent,
      ),
    data: {
      seoKey: "formations-automatiser-avec-ia-toolkit",
    },
  },
  {
    path: "formations/audit-seo-diy/toolkit",
    loadComponent: () =>
      import("./features/formations/audit-seo-diy/toolkit/toolkit-audit-seo.component").then(
        (m) => m.ToolkitAuditSeoComponent,
      ),
    data: {
      seoKey: "formations-audit-seo-diy-toolkit",
    },
  },
  // Routes dediees aux formations migrees en composants slide-driven
  // (Tasks 19/20/21). Declarees AVANT `buildFormationRoutes()` pour
  // prendre la precedence sur la route auto-generee de meme path.
  {
    path: "formations/ia-solopreneurs",
    loadComponent: () =>
      import("./features/formations/ia-solopreneurs/ia-solopreneurs.component").then(
        (m) => m.IaSolopreneursComponent,
      ),
    data: {
      seoKey: "formations-ia-solopreneurs",
    },
  },
  {
    path: "formations/automatiser-avec-ia",
    loadComponent: () =>
      import("./features/formations/automatiser-avec-ia/automatiser-avec-ia.component").then(
        (m) => m.AutomatiserAvecIaComponent,
      ),
    data: {
      seoKey: "formations-automatiser-avec-ia",
    },
  },
  {
    path: "formations/audit-seo-diy",
    loadComponent: () =>
      import("./features/formations/audit-seo-diy/audit-seo-diy.component").then(
        (m) => m.AuditSeoDiyComponent,
      ),
    data: {
      seoKey: "formations-audit-seo-diy",
    },
  },
  // Routes generees automatiquement depuis la registry de formations.
  // Chaque `FormationConfig` publiee produit une route statique
  // `/formations/<slug>` qui instancie `FormationPageComponent`. Ces
  // routes sont statiques pour contourner le bug prerender Angular 19.2
  // avec `getPrerenderParams` + i18n (angular-cli#29587).
  ...buildFormationRoutes(),
  {
    path: "slides/library",
    loadComponent: () =>
      import("./features/slides-library/slides-library.component").then(
        (m) => m.SlidesLibraryComponent,
      ),
    data: {
      seoKey: "slides-library",
      robots: "noindex, nofollow",
    },
  },
  {
    path: "**",
    loadComponent: () =>
      import("./features/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
    data: {
      seoKey: "not-found",
    },
  },
];
