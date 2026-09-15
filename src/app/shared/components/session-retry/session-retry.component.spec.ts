import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AUTH_PORT } from '../../../core/ports/auth.port';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { buildAuthUser, createAuthPortStub } from '../../../../testing/factories/auth.factory';
import { lireMarque } from '../../../../testing/marqueurs-dom';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { SessionRetryComponent } from './session-retry.component';

const CLE_DU_JETON = 'portfolio_jwt';

describe('SessionRetryComponent', () => {
  let port: ReturnType<typeof createAuthPortStub>;

  function monter() {
    const fixture = TestBed.createComponent(SessionRetryComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    localStorage.setItem(CLE_DU_JETON, 'jwt-restaure');
    port = createAuthPortStub();
    port.me.and.returnValues(
      throwError(() => new HttpErrorResponse({ status: 503 })),
      of(buildAuthUser({ roles: ['teacher'] })),
    );
    await setupTestBed({
      imports: [SessionRetryComponent],
      providers: [{ provide: AUTH_PORT, useValue: port }],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(AuthStateService).clearSession();
    localStorage.removeItem(CLE_DU_JETON);
  });

  it('ne montre rien tant que la session n a pas echoue a se verifier', () => {
    port.me.and.returnValue(of(buildAuthUser()));
    const fixture = monter();
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    expect(lireMarque(fixture, 'session-retry')).toBeNull();
  });

  it('propose un nouvel essai quand la verification echoue, puis s efface quand elle aboutit', () => {
    const fixture = monter();
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    const alerte = lireMarque(fixture, 'session-retry');
    expect(alerte?.getAttribute('role')).toBe('alert');
    expect(TestBed.inject(AuthStateService).token()).toBe('jwt-restaure');

    lireMarque(fixture, 'session-retry-bouton')?.click();
    fixture.detectChanges();

    expect(port.me).toHaveBeenCalledTimes(2);
    expect(lireMarque(fixture, 'session-retry')).toBeNull();
    expect(TestBed.inject(AuthStateService).hasRole('teacher')).toBeTrue();
  });
});
