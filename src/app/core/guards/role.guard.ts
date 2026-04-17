import { inject } from "@angular/core";
import type { CanActivateFn } from "@angular/router";
import { Router } from "@angular/router";
import { AuthStateService } from "../services/auth-state.service";

/**
 * Factory de guard fonctionnel qui verifie que l'utilisateur
 * possede le role requis. Si le role manque, redirige vers /contact
 * avec les query params `reason=access&app={role}` pour permettre a
 * l'utilisateur de demander explicitement l'acces (vs redirection
 * silencieuse vers / qui ne lui explique rien).
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

    return router.createUrlTree(["/contact"], {
      queryParams: { reason: "access", app: requiredRole },
    });
  };
}
