import type { CanActivateFn } from '@angular/router';
import { gardeApresLaSession } from './apres-la-session';

export function roleGuard(requiredRole: string): CanActivateFn {
  return gardeApresLaSession(
    (authState) => authState.isSessionResolved,
    ({ authState, router }) =>
      authState.hasRole(requiredRole) ||
      router.createUrlTree(['/contact'], {
        queryParams: { reason: 'access', app: requiredRole },
      }),
  );
}
