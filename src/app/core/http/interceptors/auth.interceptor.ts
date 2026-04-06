import type { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { tap } from "rxjs/operators";
import { AuthStateService } from "../../services/auth-state.service";

/**
 * Intercepteur HTTP qui attache le Bearer token JWT a chaque requete
 * et gere les reponses 401 (logout + redirect /login).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const token = authState.token();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    tap({
      error: (error: { status?: number }) => {
        if (error.status === 401) {
          authState.logout();
          void router.navigate(["/login"], {
            queryParams: { returnUrl: router.url },
          });
        }
      },
    }),
  );
};
