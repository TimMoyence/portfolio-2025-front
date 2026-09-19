import { test, expect } from '@playwright/test';
import { API_BASE, MOCK_SESSION } from './fixtures';

test.describe('Auth — Page de connexion', () => {
  test('la page login affiche le formulaire avec email et mot de passe', async ({ page }) => {
    await page.goto('/login');

    const loginTab = page.locator('#auth-trigger-log-in');
    await expect(loginTab).toBeVisible();
    await loginTab.click();

    const emailInput = page.locator('#auth-tab-log-in #login-email');
    const passwordInput = page.locator('#auth-tab-log-in #login-password');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    const submitButton = page.locator('#auth-tab-log-in button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test("login reussi redirige vers la page d'accueil", async ({ page }) => {
    await page.route(`${API_BASE}/auth/login`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SESSION),
      });
    });

    await page.goto('/login');

    await page.locator('#auth-trigger-log-in').click();

    await page.locator('#auth-tab-log-in #login-email').fill('test@test.com');
    await page.locator('#auth-tab-log-in #login-password').fill('password123');

    await page.locator('#auth-tab-log-in button[type="submit"]').click();

    await expect(page).toHaveURL('/');
  });

  test("login echoue affiche un message d'erreur", async ({ page }) => {
    await page.route(`${API_BASE}/auth/login`, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Identifiants invalides',
          statusCode: 401,
        }),
      });
    });

    await page.goto('/login');

    await page.locator('#auth-trigger-log-in').click();

    await page.locator('#auth-tab-log-in #login-email').fill('wrong@test.com');
    await page.locator('#auth-tab-log-in #login-password').fill('wrongpassword');

    await page.locator('#auth-tab-log-in button[type="submit"]').click();

    const errorMessage = page.locator('#auth-tab-log-in .auth-msg[role="alert"]');
    await expect(errorMessage).toBeVisible();
  });
});

test.describe("Auth — Page d'inscription", () => {
  test('la page register affiche le formulaire avec tous les champs', async ({ page }) => {
    await page.goto('/register');

    const signupPanel = page.locator('#auth-tab-sign-up');
    await expect(signupPanel).toBeVisible();

    for (const champ of ['firstName', 'lastName', 'email', 'password', 'verifPassword']) {
      await expect(page.locator(`#auth-tab-sign-up #reg-${champ}`)).toBeVisible();
    }

    const submitButton = page.locator('#auth-tab-sign-up button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });
});

test.describe('Auth — Navigation login / register', () => {
  test('les onglets permettent de basculer entre inscription et connexion', async ({ page }) => {
    await page.goto('/login');

    const signupTab = page.locator('#auth-trigger-sign-up');
    const loginTab = page.locator('#auth-trigger-log-in');

    await expect(loginTab).toHaveAttribute('aria-selected', 'true');
    await expect(signupTab).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#auth-tab-log-in')).toBeVisible();
    await expect(page.locator('#auth-tab-sign-up')).toHaveCount(0);

    await signupTab.click();
    await expect(signupTab).toHaveAttribute('aria-selected', 'true');
    await expect(loginTab).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#auth-tab-sign-up')).toBeVisible();
    await expect(page.locator('#auth-tab-log-in')).toHaveCount(0);

    await loginTab.click();
    await expect(loginTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#auth-tab-log-in')).toBeVisible();
  });

  test('le lien "Mot de passe oublie" mene vers /forgot-password', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#auth-trigger-log-in').click();

    const forgotLink = page.locator('#auth-tab-log-in a[href="/forgot-password"]');
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();

    await expect(page).toHaveURL('/forgot-password');
  });
});
