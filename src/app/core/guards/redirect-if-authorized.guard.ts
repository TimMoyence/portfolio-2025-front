import { inject } from "@angular/core";
import type { CanActivateFn } from "@angular/router";
import { Router } from "@angular/router";
import { toObservable } from "@angular/core/rxjs-interop";
import { filter, map, take } from "rxjs";
import { AuthStateService } from "../services/auth-state.service";

/**
 * Factory de guard fonctionnel pour les pages de presentation des ateliers.
 * Si l'utilisateur est authentifie et possede le role requis, il est redirige
 * vers la sous-route `/app` correspondante. Sinon, la page de presentation
 * (marketing) s'affiche normalement.
 *
 * Usage dans les routes :
 * ```ts
 * canActivate: [redirectIfAuthorizedGuard('weather')]
 * ```
 */
export function redirectIfAuthorizedGuard(requiredRole: string): CanActivateFn {
  return (_route, state) => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    const appUrl = `${state.url}/app`;

    if (authState.isInitialized()) {
      if (authState.isLoggedIn() && authState.hasRole(requiredRole)) {
        return router.createUrlTree([appUrl]);
      }
      return true;
    }

    return toObservable(authState.isInitialized).pipe(
      filter((initialized) => initialized),
      take(1),
      map(() => {
        if (authState.isLoggedIn() && authState.hasRole(requiredRole)) {
          return router.createUrlTree([appUrl]);
        }
        return true;
      }),
    );
  };
}
