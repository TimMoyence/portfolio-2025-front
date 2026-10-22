import type { AppConfig } from '../../app/core/config/app-config.model';
import { environment } from '../../environments/environment';

export function buildAppConfig(overrides?: Partial<AppConfig>): AppConfig {
  return {
    ...environment,
    ...overrides,
  };
}
