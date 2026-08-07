import type { AppConfig } from '../../app/core/config/app-config.model';

export function buildAppConfig(overrides?: Partial<AppConfig>): AppConfig {
  return {
    production: false,
    appName: 'test',
    apiBaseUrl: 'http://localhost:3000/api/v1/portfolio25/',
    baseUrl: 'http://localhost:4200',
    external: { sebastianUrl: '' },
    ...overrides,
  };
}
