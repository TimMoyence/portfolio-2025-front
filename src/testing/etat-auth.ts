import { PLATFORM_ID, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AUTH_PORT } from '../app/core/ports/auth.port';
import { AuthStateService } from '../app/core/services/auth-state.service';
import { VERROU_INTER_ONGLETS } from '../app/core/services/verrou-inter-onglets';
import { createAuthPortStub } from './factories/auth.factory';
import { createVerrouEnMemoire } from './factories/verrou.factory';
import { setupTestBed } from './setup-test-bed';

export function etatAuth(
  plateforme: 'server' | 'browser',
  port: ReturnType<typeof createAuthPortStub> = createAuthPortStub(),
): AuthStateService {
  setupTestBed({
    router: true,
    providers: [
      { provide: PLATFORM_ID, useValue: plateforme },
      { provide: AUTH_PORT, useValue: port },
    ],
  });
  return TestBed.inject(AuthStateService);
}

export function preparerAvecLePortDAuth(
  composant: Type<unknown>,
  port: () => ReturnType<typeof createAuthPortStub>,
): void {
  beforeEach(async () => {
    await setupTestBed({
      imports: [composant],
      providers: [
        { provide: AUTH_PORT, useValue: port() },
        { provide: VERROU_INTER_ONGLETS, useValue: createVerrouEnMemoire() },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(AuthStateService).clearSession();
  });
}
