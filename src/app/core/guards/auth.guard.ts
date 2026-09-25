import type { CanActivateFn } from '@angular/router';
import { gardeApresLaSession } from './apres-la-session';

export const authGuard: CanActivateFn = gardeApresLaSession(
  (authState) => authState.isSessionCheckComplete,
  ({ authState, router, state }) =>
    authState.isLoggedIn() ||
    router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    }),
);
