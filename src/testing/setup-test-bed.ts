import type { EnvironmentProviders, Provider } from '@angular/core';
import type { TestModuleMetadata } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import type { AppConfig } from '../app/core/config/app-config.model';
import { APP_CONFIG } from '../app/core/config/app-config.token';
import { buildAppConfig } from './factories/app-config.factory';

export interface SetupTestBedOptions extends TestModuleMetadata {
  appConfig?: Partial<AppConfig>;
  http?: boolean;
  router?: boolean;
}

export function setupTestBed(options: SetupTestBedOptions = {}) {
  const { appConfig, http = true, router = false, providers = [], ...metadata } = options;

  const baseProviders: (Provider | EnvironmentProviders)[] = [
    { provide: APP_CONFIG, useValue: buildAppConfig(appConfig) },
  ];

  if (http) {
    baseProviders.push(provideHttpClient(), provideHttpClientTesting());
  }

  if (router) {
    baseProviders.push(provideRouter([]));
  }

  return TestBed.configureTestingModule({
    ...metadata,
    // Angular résout un token sur le dernier provider déclaré : placer les
    // providers de l'appelant après le socle leur laisse le dernier mot.
    providers: [...baseProviders, ...providers],
  });
}
