import { test, expect } from '@playwright/test';
import {
  API_BASE,
  MOCK_FORECAST,
  MOCK_GEOCODING_RESPONSE,
  MOCK_WEATHER_PREFERENCES,
  authenticateUser,
  mockWeatherRecordUsage,
} from './fixtures';

test.describe('Weather — Page meteo authentifiee', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);

    await page.route(`${API_BASE}/weather/preferences`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_WEATHER_PREFERENCES),
      });
    });

    await mockWeatherRecordUsage(page);
  });

  test('la page meteo se charge et affiche le composant app', async ({ page }) => {
    await page.goto('/atelier/meteo/app');

    const weatherApp = page.locator('app-weather-app');
    await expect(weatherApp).toBeVisible();

    const title = page.locator('app-weather-app h1');
    await expect(title).toBeVisible();

    const searchInput = page.locator('app-city-search input[type="text"]');
    await expect(searchInput).toBeVisible();

    const hint = page.getByText('Recherchez une ville');
    await expect(hint).toBeVisible();
  });

  test('la recherche de ville affiche les resultats du geocodage', async ({ page }) => {
    await page.route(`${API_BASE}/weather/geocoding*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_GEOCODING_RESPONSE),
      });
    });

    await page.goto('/atelier/meteo/app');

    const searchInput = page.locator('app-city-search input[type="text"]');
    await searchInput.fill('Paris');

    const dropdown = page.locator('#city-search-listbox');
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    const firstResult = dropdown.locator('li').first();
    await expect(firstResult).toContainText('Paris');
    await expect(firstResult).toContainText('France');

    const secondResult = dropdown.locator('li').nth(1);
    await expect(secondResult).toContainText('Paris');
    await expect(secondResult).toContainText('United States');
  });

  test("la selection d'une ville charge et affiche les previsions", async ({ page }) => {
    await page.route(`${API_BASE}/weather/geocoding*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_GEOCODING_RESPONSE),
      });
    });

    await page.route(`${API_BASE}/weather/forecast*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_FORECAST),
      });
    });

    await page.goto('/atelier/meteo/app');

    const searchInput = page.locator('app-city-search input[type="text"]');
    await searchInput.fill('Paris');

    const dropdown = page.locator('#city-search-listbox');
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    await dropdown.locator('li').first().click();

    await expect(page.getByText('Paris, France')).toBeVisible();

    const currentConditions = page.locator('app-current-conditions');
    await expect(currentConditions).toBeVisible();

    const previsionsHebdomadaires = page.locator('app-weekly-overview');
    await expect(previsionsHebdomadaires).toBeVisible();
  });
});

test.describe('Weather — acces sans authentification', () => {
  test('l ancienne page vitrine redirige vers les projets et n ouvre pas l app', async ({
    page,
  }) => {
    await page.goto('/atelier/meteo');

    await expect(page).toHaveURL('/projets');
    await expect(page.locator('app-weather-app')).toHaveCount(0);
  });

  test('un visiteur non connecte n entre pas dans l app meteo', async ({ page }) => {
    await page.goto('/atelier/meteo/app');

    await expect(page).not.toHaveURL('/atelier/meteo/app');
    await expect(page.locator('app-weather-app')).toHaveCount(0);
  });
});
