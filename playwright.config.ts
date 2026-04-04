import { defineConfig, devices } from "@playwright/test";

/**
 * Configuration Playwright pour les tests E2E du frontend Angular.
 * Les tests utilisent page.route() pour mocker l'API backend,
 * donc aucun serveur backend n'est requis.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4200",
    trace: "on-first-retry",
    locale: "fr-FR",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:4200",
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000,
  },
});
