import { inject } from "@angular/core";
import type { CanActivateFn } from "@angular/router";
import { Router } from "@angular/router";
import { AuthStateService } from "../services/auth-state.service";

/**
 * Guard fonctionnel qui redirige vers /login si l'utilisateur
 * n'est pas authentifie. Stocke l'URL demandee en queryParam returnUrl.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (authState.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(["/login"], {
    queryParams: { returnUrl: state.url },
  });
};
