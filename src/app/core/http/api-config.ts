import { inject } from '@angular/core';
import { APP_CONFIG } from '../config/app-config.token';

export function getApiBaseUrl(): string {
  const config = inject(APP_CONFIG);
  return config.apiBaseUrl;
}
