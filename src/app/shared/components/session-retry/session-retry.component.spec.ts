import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { preparerAvecLePortDAuth } from '../../../../testing/etat-auth';
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from '../../../../testing/factories/auth.factory';
import { lireMarque } from '../../../../testing/marqueurs-dom';
import { SessionRetryComponent } from './session-retry.component';

describe('SessionRetryComponent', () => {
  let port: ReturnType<typeof createAuthPortStub>;

  function monter() {
    TestBed.inject(AuthStateService).restoreSession();
    const fixture = TestBed.createComponent(SessionRetryComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    port = createAuthPortStub();
    port.refresh.and.returnValues(
      throwError(() => new HttpErrorResponse({ status: 503 })),
      of(buildAuthSession({ user: buildAuthUser({ roles: ['teacher'] }) })),
    );
  });

  preparerAvecLePortDAuth(SessionRetryComponent, () => port);

  it('ne montre rien tant que la session n a pas echoue a se verifier', fakeAsync(() => {
    port.refresh.and.returnValue(of(buildAuthSession()));
    const fixture = monter();
    TestBed.inject(ApplicationRef).tick();
    flushMicrotasks();
    fixture.detectChanges();

    expect(lireMarque(fixture, 'session-retry')).toBeNull();
  }));

  it('propose un nouvel essai quand la verification echoue, puis s efface quand elle aboutit', fakeAsync(() => {
    const fixture = monter();
    TestBed.inject(ApplicationRef).tick();
    flushMicrotasks();
    fixture.detectChanges();

    const alerte = lireMarque(fixture, 'session-retry');
    expect(alerte?.getAttribute('role')).toBe('alert');
    expect(TestBed.inject(AuthStateService).token()).toBeNull();

    lireMarque(fixture, 'session-retry-bouton')?.click();
    flushMicrotasks();
    fixture.detectChanges();

    expect(port.refresh).toHaveBeenCalledTimes(2);
    expect(lireMarque(fixture, 'session-retry')).toBeNull();
    expect(TestBed.inject(AuthStateService).hasRole('teacher')).toBeTrue();
  }));
});
