import type { AppConfig } from '../../app/core/config/app-config.model';
import { environment } from '../../environments/environment';

// `environment` est un objet littéral sans annotation : TypeScript élargit
// `gdpr.regionScope` en `string`, incompatible avec le littéral `'EU_UK'` exigé
// par `AppConfig`. L'assertion restreint ce seul champ ; annoter la source
// releverait de `src/environments/`, hors du périmètre de test.
const environmentConfig = environment as AppConfig;

export function buildAppConfig(overrides?: Partial<AppConfig>): AppConfig {
  return {
    ...environmentConfig,
    ...overrides,
  };
}
