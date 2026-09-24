import type { Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import type { GuardResult, MaybeAsync } from '@angular/router';
import { filter, map, take } from 'rxjs';
import type { AuthStateService } from '../services/auth-state.service';

export function deciderApresLaSession(
  authState: AuthStateService,
  sessionPrete: Signal<boolean>,
  decide: () => GuardResult,
): MaybeAsync<GuardResult> {
  const pretAvantLaRestauration = sessionPrete();
  if (!pretAvantLaRestauration) {
    authState.restoreSession();
  }
  return pretAvantLaRestauration
    ? decide()
    : toObservable(sessionPrete).pipe(
        filter((prete) => prete),
        take(1),
        map(decide),
      );
}
