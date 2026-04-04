/**
 * Tests de regression visuelle — Playwright Screenshots.
 *
 * Ces tests capturent des screenshots full-page des pages publiques
 * et les comparent aux references stockees dans `e2e/__screenshots__/`.
 *
 * ---------- Procedure de generation / mise a jour des references ----------
 *
 * 1. Lancer le serveur Angular en local :
 *      npm run start
 *
 * 2. Generer les screenshots de reference (premiere fois) :
 *      npm run test:visual:update
 *
 * 3. Verifier visuellement les images dans `e2e/__screenshots__/`
 *    puis les commiter.
 *
 * 4. Pour les executions suivantes, lancer simplement :
 *      npm run test:visual
 *
 * 5. En cas de changement volontaire de l'UI, mettre a jour les references :
 *      npm run test:visual:update
 *
 * ---------- Remarques ----------
 *
 * - Le seuil de tolerance est configure dans playwright.config.ts
 *   (maxDiffPixelRatio: 0.01 soit 1% de pixels differents).
 * - Les screenshots sont pris en Chromium Desktop uniquement.
 * - Les resultats temporaires (diffs, etc.) sont dans e2e/test-results/
 *   et sont ignores par git.
 */
import { test, expect } from "@playwright/test";

test.describe("Regression visuelle — Pages publiques", () => {
  test("page d'accueil — screenshot full-page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Attendre que le contenu principal soit visible
    await page.locator("body").waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("accueil.png", { fullPage: true });
  });

  test("page login — screenshot full-page", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    // Attendre que le formulaire d'authentification soit visible
    await page.locator("body").waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("login.png", { fullPage: true });
  });

  test("page contact — screenshot full-page", async ({ page }) => {
    await page.goto("/contact", { waitUntil: "networkidle" });

    // Attendre que le contenu de la page contact soit visible
    await page.locator("body").waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("contact.png", { fullPage: true });
  });
});
