import { inject } from '@angular/core';
import type { CanActivateFn, GuardResult } from '@angular/router';
import { Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { deciderApresLaSession } from './apres-la-session';

export const authGuard: CanActivateFn = (_route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const decide = (): GuardResult =>
    authState.isLoggedIn() ||
    router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });

  return deciderApresLaSession(authState, authState.isSessionCheckComplete, decide);
};
