import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { APP_CONFIG } from '../../config/app-config.token';
import { AuthStateService } from '../../services/auth-state.service';
import { ENTETE_JETON_PARTICIPANT } from '../jeton-participant';

function returnUrlOf(router: Router): string {
  const navigation = router.getCurrentNavigation();
  return navigation === null
    ? router.url
    : router.serializeUrl(navigation.finalUrl ?? navigation.extractedUrl);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const config = inject(APP_CONFIG);

  const token = authState.token();
  const targetsOwnApi = req.url.startsWith(config.apiBaseUrl);
  const authReq =
    token && targetsOwnApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  const concernsTeacherSession = !req.headers.has(ENTETE_JETON_PARTICIPANT);

  return next(authReq).pipe(
    tap({
      error: (error: { status?: number }) => {
        if (error.status === 401 && concernsTeacherSession) {
          authState.clearSession();
          void router.navigate(['/login'], {
            queryParams: { returnUrl: returnUrlOf(router) },
          });
        }
      },
    }),
  );
};
