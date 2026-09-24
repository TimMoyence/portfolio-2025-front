import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import type { CanActivateFn, GuardResult } from '@angular/router';
import { Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

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

  const sessionCheckWasComplete = authState.isSessionCheckComplete();
  if (!sessionCheckWasComplete) {
    authState.restoreSession();
  }

  return sessionCheckWasComplete
    ? decide()
    : toObservable(authState.isSessionCheckComplete).pipe(
        filter((complete) => complete),
        take(1),
        map(decide),
      );
};
