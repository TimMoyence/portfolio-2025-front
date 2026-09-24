import { inject } from '@angular/core';
import type { CanActivateFn, GuardResult } from '@angular/router';
import { Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { deciderApresLaSession } from './apres-la-session';

export const coursEntreeGuard: CanActivateFn = (route) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const slug = route.data['coursSlug'];

  const decide = (): GuardResult => {
    if (typeof slug !== 'string') {
      return router.createUrlTree(['/cours/rejoindre']);
    }
    return authState.hasRole('teacher')
      ? router.createUrlTree(['/cours/presenter', slug])
      : router.createUrlTree(['/cours/rejoindre'], { queryParams: { cours: slug } });
  };

  return deciderApresLaSession(authState, authState.isSessionCheckComplete, decide);
};
