import type { AppConfig } from "../../app/core/config/app-config.model";

/**
 * Construit un objet `AppConfig` de test avec des valeurs par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 *
 * Permet d'eviter la duplication d'un mock d'`AppConfig` dans chaque
 * fichier `.spec.ts` qui injecte le token `APP_CONFIG`.
 */
export function buildAppConfig(overrides?: Partial<AppConfig>): AppConfig {
  return {
    production: false,
    appName: "test",
    apiBaseUrl: "http://localhost:3000/api/v1/portfolio25/",
    baseUrl: "http://localhost:4200",
    external: { sebastianUrl: "" },
    ...overrides,
  };
}
