import { inject } from "@angular/core";
import type { CanActivateFn } from "@angular/router";
import { Router } from "@angular/router";
import { AuthStateService } from "../services/auth-state.service";

/**
 * Factory de guard fonctionnel qui verifie que l'utilisateur
 * possede le role requis. Redirige vers / si le role manque.
 *
 * Usage dans les routes :
 * ```ts
 * canActivate: [authGuard, roleGuard('budget')]
 * ```
 */
export function roleGuard(requiredRole: string): CanActivateFn {
  return () => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    if (authState.hasRole(requiredRole)) {
      return true;
    }

    return router.createUrlTree(["/"]);
  };
}
