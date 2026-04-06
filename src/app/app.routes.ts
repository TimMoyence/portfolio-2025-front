import type { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { roleGuard } from "./core/guards/role.guard";

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
  {
    path: "atelier/meteo",
    canActivate: [authGuard, roleGuard("weather")],
    loadComponent: () =>
      import("./features/weather/weather.component").then(
        (m) => m.WeatherComponent,
      ),
    data: {
      seoKey: "weather",
    },
  },
  {
    path: "atelier/budget",
    canActivate: [authGuard, roleGuard("budget")],
    loadComponent: () =>
      import("./features/budget/budget.component").then(
        (m) => m.BudgetComponent,
      ),
    data: {
      seoKey: "budget",
    },
  },
  {
    path: "atelier/sebastian",
    canActivate: [authGuard, roleGuard("sebastian")],
    loadComponent: () =>
      import("./features/sebastian/sebastian.component").then(
        (m) => m.SebastianComponent,
      ),
    data: {
      seoKey: "sebastian",
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
    redirectTo: "atelier/budget",
    pathMatch: "full" as const,
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
