import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import type { CanActivateFn, GuardResult } from '@angular/router';
import { Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

export function roleGuard(requiredRole: string): CanActivateFn {
  return () => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    const decide = (): GuardResult =>
      authState.hasRole(requiredRole) ||
      router.createUrlTree(['/contact'], {
        queryParams: { reason: 'access', app: requiredRole },
      });

    return authState.isSessionResolved()
      ? decide()
      : toObservable(authState.isSessionResolved).pipe(
          filter((resolved) => resolved),
          take(1),
          map(decide),
        );
  };
}
