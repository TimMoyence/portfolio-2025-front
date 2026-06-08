import type { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { tap } from "rxjs/operators";
import { APP_CONFIG } from "../../config/app-config.token";
import { AuthStateService } from "../../services/auth-state.service";

/**
 * Intercepteur HTTP qui attache le Bearer token JWT aux requetes de notre API
 * et gere les reponses 401 (logout + redirect /login).
 *
 * Le header `Authorization` n'est ajoute QUE si l'URL cible notre API
 * (`req.url.startsWith(apiBaseUrl)`), afin de ne jamais fuiter le JWT vers
 * des API tierces (RainViewer, Nominatim, etc.). Les adapters utilisent tous
 * `apiBaseUrl` ; `sebastianUrl` commence par `apiBaseUrl` donc reste couvert.
 * La gestion du 401 reste globale (toutes requetes).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const config = inject(APP_CONFIG);

  const token = authState.token();
  const targetsOwnApi = req.url.startsWith(config.apiBaseUrl);
  const authReq =
    token && targetsOwnApi
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
