import { inject } from '@angular/core';
import type { CanActivateFn, GuardResult } from '@angular/router';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

export function redirectIfAuthorizedGuard(requiredRole: string): CanActivateFn {
  return (_route, state) => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    const decide = (): GuardResult =>
      authState.isLoggedIn() && authState.hasRole(requiredRole)
        ? router.createUrlTree([`${state.url}/app`])
        : true;

    return authState.isInitialized()
      ? decide()
      : toObservable(authState.isInitialized).pipe(
          filter((initialized) => initialized),
          take(1),
          map(decide),
        );
  };
}
