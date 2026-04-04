/**
 * Tests E2E du flux meteo.
 *
 * La route /atelier/meteo n'a pas de guard dans le routeur,
 * mais le WeatherComponent verifie en interne si l'utilisateur
 * possede le role "weather" pour afficher l'app ou la page de presentation.
 *
 * Toutes les requetes API sont interceptees via page.route().
 */
import { test, expect } from "@playwright/test";
import {
  API_BASE,
  MOCK_FORECAST,
  MOCK_GEOCODING_RESPONSE,
  MOCK_WEATHER_PREFERENCES,
  authenticateUser,
  mockWeatherRecordUsage,
} from "./fixtures";

test.describe("Weather — Page meteo authentifiee", () => {
  test.beforeEach(async ({ page }) => {
    // Authentifier l'utilisateur (role "weather" inclus)
    await authenticateUser(page);

    // Mock des endpoints appeles au demarrage de WeatherAppComponent
    await page.route(`${API_BASE}/weather/preferences`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_WEATHER_PREFERENCES),
        });
      } else {
        // PATCH pour les mises a jour de preferences
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_WEATHER_PREFERENCES),
        });
      }
    });

    await mockWeatherRecordUsage(page);
  });

  test("la page meteo se charge et affiche le composant app", async ({
    page,
  }) => {
    await page.goto("/atelier/meteo");

    // Avec le role "weather", le WeatherComponent affiche <app-weather-app>
    const weatherApp = page.locator("app-weather-app");
    await expect(weatherApp).toBeVisible();

    // Le titre "Meteo" doit etre present
    const title = page.locator("app-weather-app h1");
    await expect(title).toBeVisible();

    // Le champ de recherche de ville doit etre visible
    const searchInput = page.locator('app-city-search input[type="text"]');
    await expect(searchInput).toBeVisible();

    // Le message initial "Recherchez une ville" doit etre present
    // car aucune ville n'est selectionnee
    const hint = page.getByText("Recherchez une ville");
    await expect(hint).toBeVisible();
  });

  test("la recherche de ville affiche les resultats du geocodage", async ({
    page,
  }) => {
    // Mock de l'endpoint de geocodage
    await page.route(`${API_BASE}/weather/geocoding*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_GEOCODING_RESPONSE),
      });
    });

    await page.goto("/atelier/meteo");

    // Taper "Paris" dans le champ de recherche
    const searchInput = page.locator('app-city-search input[type="text"]');
    await searchInput.fill("Paris");

    // Attendre que le menu deroulant apparaisse (debounce de 300ms dans le composant)
    const dropdown = page.locator("#city-search-listbox");
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // Les resultats doivent contenir "Paris, France"
    const firstResult = dropdown.locator("li").first();
    await expect(firstResult).toContainText("Paris");
    await expect(firstResult).toContainText("France");

    // Le second resultat doit contenir "Paris, United States"
    const secondResult = dropdown.locator("li").nth(1);
    await expect(secondResult).toContainText("Paris");
    await expect(secondResult).toContainText("United States");
  });

  test("la selection d'une ville charge et affiche les previsions", async ({
    page,
  }) => {
    // Mock geocodage
    await page.route(`${API_BASE}/weather/geocoding*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_GEOCODING_RESPONSE),
      });
    });

    // Mock previsions meteo
    await page.route(`${API_BASE}/weather/forecast*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FORECAST),
      });
    });

    await page.goto("/atelier/meteo");

    // Rechercher et selectionner Paris
    const searchInput = page.locator('app-city-search input[type="text"]');
    await searchInput.fill("Paris");

    const dropdown = page.locator("#city-search-listbox");
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    await dropdown.locator("li").first().click();

    // Apres selection, le nom de la ville doit apparaitre sous le titre
    await expect(page.getByText("Paris, France")).toBeVisible();

    // Le composant CurrentConditions doit etre rendu avec les donnees
    const currentConditions = page.locator("app-current-conditions");
    await expect(currentConditions).toBeVisible();

    // Le composant DailyForecast doit etre rendu
    const dailyForecast = page.locator("app-daily-forecast");
    await expect(dailyForecast).toBeVisible();
  });
});

test.describe("Weather — Page de presentation (non authentifie)", () => {
  test("un utilisateur non connecte voit la page de presentation", async ({
    page,
  }) => {
    await page.goto("/atelier/meteo");

    // Sans authentification, le WeatherComponent affiche <app-weather-presentation>
    const presentation = page.locator("app-weather-presentation");
    await expect(presentation).toBeVisible();

    // L'app meteo ne doit PAS etre affichee
    const weatherApp = page.locator("app-weather-app");
    await expect(weatherApp).not.toBeVisible();
  });
});
