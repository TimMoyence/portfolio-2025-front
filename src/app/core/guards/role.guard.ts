import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

/**
 * Redirige vers /contact plutot que vers / pour que l'utilisateur puisse
 * demander explicitement l'acces au lieu d'etre renvoye sans explication.
 */
export function roleGuard(requiredRole: string): CanActivateFn {
  return () => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    if (authState.hasRole(requiredRole)) {
      return true;
    }

    return router.createUrlTree(['/contact'], {
      queryParams: { reason: 'access', app: requiredRole },
    });
  };
}
