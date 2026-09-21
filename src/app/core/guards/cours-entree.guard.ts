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

  const decide = (): GuardResult =>
    (authState.hasRole('teacher') &&
      typeof slug === 'string' &&
      router.createUrlTree(['/cours/presenter', slug])) ||
    (authState.isLoggedIn() && router.createUrlTree(['/cours/rejoindre'])) ||
    true;

  return authState.isSessionResolved()
    ? decide()
    : toObservable(authState.isSessionResolved).pipe(
        filter((resolved) => resolved),
        take(1),
        map(decide),
      );
};
