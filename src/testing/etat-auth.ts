import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AUTH_PORT } from '../app/core/ports/auth.port';
import { AuthStateService } from '../app/core/services/auth-state.service';
import { createAuthPortStub } from './factories/auth.factory';
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
