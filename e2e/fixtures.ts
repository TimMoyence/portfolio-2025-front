/**
 * Fixtures et helpers partages pour les tests E2E Playwright.
 * Centralise les donnees mockees et les utilitaires d'authentification
 * pour eviter la duplication dans chaque fichier de test.
 */

import type { Page } from "@playwright/test";

// ---------- Constantes ----------

/** Prefixe API utilise par le frontend en dev. */
export const API_BASE = "http://localhost:3000/api/v1/portfolio25";

/** Cle localStorage utilisee par AuthStateService. */
const TOKEN_KEY = "portfolio_jwt";

// ---------- Donnees mockees ----------

/** Utilisateur fictif avec les roles budget et weather. */
export const MOCK_USER = {
  id: "1",
  email: "test@test.com",
  firstName: "Test",
  lastName: "User",
  phone: null,
  isActive: true,
  roles: ["budget", "weather"],
  hasPassword: true,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
  updatedOrCreatedBy: null,
};

/** Session d'authentification fictive. */
export const MOCK_SESSION = {
  accessToken: "fake-jwt-token-for-e2e-tests",
  expiresIn: 3600,
  user: MOCK_USER,
};

/** Preferences meteo fictives (niveau decouverte, pas de favoris). */
export const MOCK_WEATHER_PREFERENCES = {
  id: "pref-1",
  userId: "1",
  level: "discovery" as const,
  favoriteCities: [],
  daysUsed: 5,
  lastUsedAt: "2025-04-01T10:00:00.000Z",
  tooltipsSeen: [],
  units: undefined,
};

/** Resultat de geocodage fictif pour Paris. */
export const MOCK_GEOCODING_RESPONSE = {
  results: [
    {
      id: 2988507,
      name: "Paris",
      latitude: 48.8566,
      longitude: 2.3522,
      country: "France",
      country_code: "FR",
      admin1: "Ile-de-France",
    },
    {
      id: 4717560,
      name: "Paris",
      latitude: 33.6609,
      longitude: -95.5555,
      country: "United States",
      country_code: "US",
      admin1: "Texas",
    },
  ],
};

/** Previsions meteo fictives minimales pour Paris. */
export const MOCK_FORECAST = {
  current: {
    time: "2025-04-01T12:00",
    temperature_2m: 18.5,
    weather_code: 1,
    wind_speed_10m: 12.3,
    apparent_temperature: 16.2,
    relative_humidity_2m: 65,
    pressure_msl: 1013,
    uv_index: 4,
    wind_direction_10m: 220,
    wind_gusts_10m: 25,
  },
  hourly: {
    time: Array.from(
      { length: 24 },
      (_, i) => `2025-04-01T${String(i).padStart(2, "0")}:00`,
    ),
    temperature_2m: Array.from(
      { length: 24 },
      (_, i) => 14 + Math.sin(i / 4) * 5,
    ),
    weather_code: Array(24).fill(1),
    wind_speed_10m: Array(24).fill(12),
    precipitation: Array(24).fill(0),
    relative_humidity_2m: Array(24).fill(65),
  },
  daily: {
    time: ["2025-04-01", "2025-04-02", "2025-04-03"],
    weather_code: [1, 2, 3],
    temperature_2m_max: [20, 22, 19],
    temperature_2m_min: [12, 14, 11],
    sunrise: ["2025-04-01T06:30", "2025-04-02T06:28", "2025-04-03T06:26"],
    sunset: ["2025-04-01T19:45", "2025-04-02T19:47", "2025-04-03T19:49"],
    precipitation_sum: [0, 2.5, 0.3],
  },
};

// ---------- Helpers ----------

/**
 * Simule une session authentifiee dans le navigateur.
 * Place le token JWT dans localStorage et configure le mock GET /auth/me
 * pour retourner l'utilisateur fictif.
 *
 * IMPORTANT : doit etre appele AVANT page.goto() pour que le token soit
 * present quand Angular demarre et restaure la session.
 */
export async function authenticateUser(page: Page): Promise<void> {
  // Mock GET /auth/me pour la restauration de session
  await page.route(`${API_BASE}/auth/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_USER),
    });
  });

  // Naviguer d'abord vers la page pour avoir acces au localStorage
  // puis injecter le token avant de recharger
  await page.goto("/");
  await page.evaluate(
    ([key, token]) => {
      localStorage.setItem(key, token);
    },
    [TOKEN_KEY, MOCK_SESSION.accessToken] as const,
  );
}

/**
 * Mock le endpoint POST /weather/preferences/record-usage
 * qui est appele au demarrage de l'app meteo.
 */
export async function mockWeatherRecordUsage(page: Page): Promise<void> {
  await page.route(
    `${API_BASE}/weather/preferences/record-usage`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(undefined),
      });
    },
  );
}
