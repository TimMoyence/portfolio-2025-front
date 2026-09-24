import { inject } from '@angular/core';
import type { CanActivateFn, GuardResult } from '@angular/router';
import { Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { deciderApresLaSession } from './apres-la-session';

export function roleGuard(requiredRole: string): CanActivateFn {
  return () => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    const decide = (): GuardResult =>
      authState.hasRole(requiredRole) ||
      router.createUrlTree(['/contact'], {
        queryParams: { reason: 'access', app: requiredRole },
      });

    return deciderApresLaSession(authState, authState.isSessionResolved, decide);
  };
}
