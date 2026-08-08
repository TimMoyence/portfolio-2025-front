import { inject } from '@angular/core';
import type { CanActivateFn, GuardResult } from '@angular/router';
import { Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

export function roleGuard(requiredRole: string): CanActivateFn {
  return (): GuardResult => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    return (
      authState.hasRole(requiredRole) ||
      router.createUrlTree(['/contact'], {
        queryParams: { reason: 'access', app: requiredRole },
      })
    );
  };
}
