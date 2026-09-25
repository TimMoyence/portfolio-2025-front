import type { Signal } from '@angular/core';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import type {
  ActivatedRouteSnapshot,
  CanActivateFn,
  GuardResult,
  MaybeAsync,
  RouterStateSnapshot,
} from '@angular/router';
import { Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

export interface ContexteDeGarde {
  readonly authState: AuthStateService;
  readonly router: Router;
  readonly route: ActivatedRouteSnapshot;
  readonly state: RouterStateSnapshot;
}

export function gardeApresLaSession(
  sessionPrete: (authState: AuthStateService) => Signal<boolean>,
  decider: (contexte: ContexteDeGarde) => GuardResult,
): CanActivateFn {
  return (route, state) => {
    const authState = inject(AuthStateService);
    const router = inject(Router);
    return deciderApresLaSession(authState, sessionPrete(authState), () =>
      decider({ authState, router, route, state }),
    );
  };
}

function deciderApresLaSession(
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
