import { authGuard } from "./core/guards/auth.guard";
import { routes } from "./app.routes";

describe("app routes", () => {
  it("contains forgot-password and reset-password routes", () => {
    expect(routes.some((route) => route.path === "forgot-password")).toBeTrue();
    expect(routes.some((route) => route.path === "reset-password")).toBeTrue();
  });

  it("protects /profil with authGuard", () => {
    const profileRoute = routes.find((route) => route.path === "profil");

    expect(profileRoute).toBeDefined();
    expect(profileRoute?.canActivate).toBeDefined();
    expect(profileRoute?.canActivate?.includes(authGuard)).toBeTrue();
  });

  it("devrait contenir toutes les routes principales", () => {
    // Arrange
    const cheminsPrincipaux = [
      "",
      "home",
      "login",
      "register",
      "forgot-password",
      "reset-password",
      "profil",
      "presentation",
      "offer",
      "contact",
      "client-project",
      "cookie-settings",
      "terms",
      "privacy",
      "growth-audit",
      "atelier/meteo",
      "atelier/budget",
      "atelier/sebastian",
      "commonbudgetTM",
      "**",
    ];

    // Act & Assert
    for (const chemin of cheminsPrincipaux) {
      expect(routes.find((r) => r.path === chemin))
        .withContext(`la route '${chemin}' devrait exister`)
        .toBeDefined();
    }
  });

  it("devrait protéger /atelier/budget avec authGuard et roleGuard budget", () => {
    // Arrange
    const budgetRoute = routes.find((r) => r.path === "atelier/budget");

    // Assert
    expect(budgetRoute).toBeDefined();
    expect(budgetRoute?.canActivate).toBeDefined();
    expect(budgetRoute?.canActivate?.length).toBe(2);
    expect(budgetRoute?.canActivate?.[0]).toBe(authGuard);
    // Le second guard est le résultat de roleGuard('budget') — une CanActivateFn
    expect(typeof budgetRoute?.canActivate?.[1]).toBe("function");
  });

  it("devrait rediriger /home vers /", () => {
    // Arrange
    const homeRedirect = routes.find((r) => r.path === "home");

    // Assert
    expect(homeRedirect).toBeDefined();
    expect(homeRedirect?.redirectTo).toBe("");
    expect(homeRedirect?.pathMatch).toBe("full");
  });

  it("devrait rediriger /commonbudgetTM vers /atelier/budget", () => {
    // Arrange
    const commonBudgetRedirect = routes.find(
      (r) => r.path === "commonbudgetTM",
    );

    // Assert
    expect(commonBudgetRedirect).toBeDefined();
    expect(commonBudgetRedirect?.redirectTo).toBe("atelier/budget");
    expect(commonBudgetRedirect?.pathMatch).toBe("full");
  });

  it("devrait définir un seoKey pour chaque route indexable", () => {
    // Arrange — routes indexables : celles qui ont un loadComponent (pas de redirectTo)
    const routesIndexables = routes.filter(
      (r) => r.loadComponent && !r.redirectTo,
    );

    // Assert
    expect(routesIndexables.length).toBeGreaterThan(0);
    for (const route of routesIndexables) {
      expect(route.data?.["seoKey"])
        .withContext(`la route '${route.path}' devrait avoir un seoKey`)
        .toBeTruthy();
    }
  });

  it("devrait avoir un fallback ** vers not-found", () => {
    // Arrange
    const derniereRoute = routes[routes.length - 1];

    // Assert
    expect(derniereRoute.path).toBe("**");
    expect(derniereRoute.loadComponent).toBeDefined();
    expect(derniereRoute.data?.["seoKey"]).toBe("not-found");
  });
});
