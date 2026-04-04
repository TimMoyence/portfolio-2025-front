/**
 * Tests E2E du flux d'authentification (login / register).
 *
 * Toutes les requetes API sont interceptees via page.route()
 * pour fonctionner SANS backend reel.
 */
import { test, expect } from "@playwright/test";
import { API_BASE, MOCK_SESSION, MOCK_USER } from "./fixtures";

test.describe("Auth — Page de connexion", () => {
  test("la page login affiche le formulaire avec email et mot de passe", async ({
    page,
  }) => {
    await page.goto("/login");

    // Le composant AuthComponent demarre sur l'onglet "sign-up" par defaut.
    // On clique sur l'onglet "Connexion" pour afficher le formulaire de login.
    const loginTab = page.locator("#auth-trigger-log-in");
    await expect(loginTab).toBeVisible();
    await loginTab.click();

    // Verification que les champs du formulaire login sont presents
    const emailInput = page.locator('#auth-tab-log-in input[name="email"]');
    const passwordInput = page.locator(
      '#auth-tab-log-in input[name="password"]',
    );
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Le bouton de soumission doit etre present
    const submitButton = page.locator('#auth-tab-log-in button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test("login reussi redirige vers la page d'accueil", async ({ page }) => {
    // Mock de l'endpoint POST /auth/login
    await page.route(`${API_BASE}/auth/login`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SESSION),
      });
    });

    await page.goto("/login");

    // Basculer vers l'onglet connexion
    await page.locator("#auth-trigger-log-in").click();

    // Remplir le formulaire
    await page
      .locator('#auth-tab-log-in input[name="email"]')
      .fill("test@test.com");
    await page
      .locator('#auth-tab-log-in input[name="password"]')
      .fill("password123");

    // Soumettre
    await page.locator('#auth-tab-log-in button[type="submit"]').click();

    // Apres un login reussi, le composant redirige vers "/"
    await expect(page).toHaveURL("/");
  });

  test("login echoue affiche un message d'erreur", async ({ page }) => {
    // Mock de l'endpoint POST /auth/login qui retourne une erreur 401
    await page.route(`${API_BASE}/auth/login`, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Identifiants invalides",
          statusCode: 401,
        }),
      });
    });

    await page.goto("/login");

    // Basculer vers l'onglet connexion
    await page.locator("#auth-trigger-log-in").click();

    // Remplir le formulaire avec des identifiants incorrects
    await page
      .locator('#auth-tab-log-in input[name="email"]')
      .fill("wrong@test.com");
    await page
      .locator('#auth-tab-log-in input[name="password"]')
      .fill("wrongpassword");

    // Soumettre
    await page.locator('#auth-tab-log-in button[type="submit"]').click();

    // Le message d'erreur doit s'afficher dans le panneau login
    const errorMessage = page.locator("#auth-tab-log-in .text-red-500");
    await expect(errorMessage).toBeVisible();
  });
});

test.describe("Auth — Page d'inscription", () => {
  test("la page register affiche le formulaire avec tous les champs", async ({
    page,
  }) => {
    await page.goto("/register");

    // Le composant AuthComponent affiche l'onglet "sign-up" par defaut
    // quand on navigue vers /register (ou /login d'ailleurs).
    // Verifions que le panneau inscription est visible.
    const signupPanel = page.locator("#auth-tab-sign-up");
    await expect(signupPanel).toBeVisible();

    // Verification des champs du formulaire d'inscription
    const firstNameInput = page.locator(
      '#auth-tab-sign-up input[name="firstName"]',
    );
    const lastNameInput = page.locator(
      '#auth-tab-sign-up input[name="lastName"]',
    );
    const emailInput = page.locator('#auth-tab-sign-up input[name="email"]');
    const passwordInput = page.locator(
      '#auth-tab-sign-up input[name="password"]',
    );
    const verifPasswordInput = page.locator(
      '#auth-tab-sign-up input[name="verifPassword"]',
    );

    await expect(firstNameInput).toBeVisible();
    await expect(lastNameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(verifPasswordInput).toBeVisible();

    // Le bouton de soumission doit etre present
    const submitButton = page.locator(
      '#auth-tab-sign-up button[type="submit"]',
    );
    await expect(submitButton).toBeVisible();
  });
});

test.describe("Auth — Navigation login / register", () => {
  test("les onglets permettent de basculer entre inscription et connexion", async ({
    page,
  }) => {
    await page.goto("/login");

    // Par defaut, l'onglet inscription est actif
    const signupTab = page.locator("#auth-trigger-sign-up");
    const loginTab = page.locator("#auth-trigger-log-in");

    await expect(signupTab).toHaveAttribute("data-state", "active");
    await expect(loginTab).toHaveAttribute("data-state", "inactive");

    // Cliquer sur l'onglet connexion
    await loginTab.click();
    await expect(loginTab).toHaveAttribute("data-state", "active");
    await expect(signupTab).toHaveAttribute("data-state", "inactive");

    // Le panneau login doit etre visible
    await expect(page.locator("#auth-tab-log-in")).toBeVisible();

    // Cliquer sur l'onglet inscription pour revenir
    await signupTab.click();
    await expect(signupTab).toHaveAttribute("data-state", "active");
    await expect(page.locator("#auth-tab-sign-up")).toBeVisible();
  });

  test('le lien "Mot de passe oublie" mene vers /forgot-password', async ({
    page,
  }) => {
    await page.goto("/login");

    // Basculer vers l'onglet connexion pour voir le lien
    await page.locator("#auth-trigger-log-in").click();

    const forgotLink = page.locator(
      '#auth-tab-log-in a[href="/forgot-password"]',
    );
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();

    await expect(page).toHaveURL("/forgot-password");
  });
});
