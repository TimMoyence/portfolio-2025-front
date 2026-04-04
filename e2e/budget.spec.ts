/**
 * Tests E2E du flux budget.
 *
 * La route /atelier/budget est protegee par authGuard + roleGuard('budget').
 * Sans authentification, l'utilisateur est redirige vers /login.
 * Avec authentification mais sans role, il voit la page de presentation.
 * Avec le role "budget", il accede au dashboard CommonBudgetTM.
 *
 * Toutes les requetes API sont interceptees via page.route().
 */
import { test, expect } from "@playwright/test";
import {
  API_BASE,
  MOCK_USER,
  MOCK_SESSION,
  authenticateUser,
} from "./fixtures";

test.describe("Budget — Acces non authentifie", () => {
  test("un utilisateur non connecte est redirige vers /login", async ({
    page,
  }) => {
    // Sans token dans localStorage, authGuard redirige vers /login
    await page.goto("/atelier/budget");

    // La redirection doit amener vers la page de login
    await expect(page).toHaveURL("/login");
  });
});

test.describe("Budget — Utilisateur authentifie avec role budget", () => {
  test.beforeEach(async ({ page }) => {
    // Authentifier l'utilisateur avec le role "budget"
    await authenticateUser(page);
  });

  test("la page budget se charge et affiche le composant dashboard", async ({
    page,
  }) => {
    // Naviguer vers la page budget (le token est deja en localStorage)
    await page.goto("/atelier/budget");

    // Avec le role "budget", le BudgetComponent affiche <app-common-budget-tm>
    // Verifions que le composant app-budget est present et que la page
    // n'est PAS la page de presentation (qui contient un CTA "Se connecter")
    const budgetRoot = page.locator("app-budget");
    await expect(budgetRoot).toBeVisible();

    // Le composant CommonBudgetTM doit etre rendu (et non BudgetPresentation)
    const dashboard = page.locator("app-common-budget-tm");
    await expect(dashboard).toBeVisible();
  });
});

test.describe("Budget — Utilisateur authentifie sans role budget", () => {
  test("la page de presentation s'affiche sans le role budget", async ({
    page,
  }) => {
    // Creer un utilisateur sans le role "budget"
    const userWithoutBudgetRole = {
      ...MOCK_USER,
      roles: ["weather"], // uniquement weather, pas budget
    };

    // Mock GET /auth/me avec un utilisateur sans role budget
    await page.route(`${API_BASE}/auth/me`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(userWithoutBudgetRole),
      });
    });

    // Injecter le token et naviguer
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("portfolio_jwt", "fake-jwt-token-for-e2e-tests");
    });

    await page.goto("/atelier/budget");

    // Sans le role "budget", le BudgetComponent affiche <app-budget-presentation>
    const presentation = page.locator("app-budget-presentation");
    await expect(presentation).toBeVisible();

    // La page de presentation contient un lien vers /login
    const loginLink = presentation.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
  });
});
