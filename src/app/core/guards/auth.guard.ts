import { inject } from "@angular/core";
import type { CanActivateFn } from "@angular/router";
import { Router } from "@angular/router";
import { toObservable } from "@angular/core/rxjs-interop";
import { filter, map, take } from "rxjs";
import { AuthStateService } from "../services/auth-state.service";

/**
 * Guard fonctionnel SSR-safe qui attend la fin de l'initialisation
 * de l'AuthStateService avant de verifier l'authentification.
 * Redirige vers /login avec returnUrl si l'utilisateur n'est pas connecte.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (authState.isInitialized()) {
    if (authState.isLoggedIn()) return true;
    return router.createUrlTree(["/login"], {
      queryParams: { returnUrl: state.url },
    });
  }

  return toObservable(authState.isInitialized).pipe(
    filter((initialized) => initialized),
    take(1),
    map(() => {
      if (authState.isLoggedIn()) return true;
      return router.createUrlTree(["/login"], {
        queryParams: { returnUrl: state.url },
      });
    }),
  );
};
