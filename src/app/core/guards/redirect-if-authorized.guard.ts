import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

export function redirectIfAuthorizedGuard(requiredRole: string): CanActivateFn {
  return (_route, state) => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    const appUrl = `${state.url}/app`;

    if (authState.isInitialized()) {
      if (authState.isLoggedIn() && authState.hasRole(requiredRole)) {
        return router.createUrlTree([appUrl]);
      }
      return true;
    }

    return toObservable(authState.isInitialized).pipe(
      filter((initialized) => initialized),
      take(1),
      map(() => {
        if (authState.isLoggedIn() && authState.hasRole(requiredRole)) {
          return router.createUrlTree([appUrl]);
        }
        return true;
      }),
    );
  };
}
