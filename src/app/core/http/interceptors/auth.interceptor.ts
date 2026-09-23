import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { APP_CONFIG } from '../../config/app-config.token';
import { AuthStateService } from '../../services/auth-state.service';
import { ENTETE_JETON_PARTICIPANT } from '../jeton-participant';

const LOGIN_URL = '/login';
const REFRESH_PATH = '/auth/refresh';

function pendingNavigationUrl(router: Router): string | null {
  const navigation = router.getCurrentNavigation();
  return navigation === null
    ? null
    : router.serializeUrl(navigation.finalUrl ?? navigation.extractedUrl);
}

function isLoginUrl(url: string): boolean {
  return url === LOGIN_URL || url.startsWith(`${LOGIN_URL}?`);
}

function redirectToLogin(router: Router): void {
  const pendingUrl = pendingNavigationUrl(router);
  if (pendingUrl !== null && isLoginUrl(pendingUrl)) {
    return;
  }
  void router.navigate([LOGIN_URL], {
    queryParams: { returnUrl: pendingUrl ?? router.url },
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const config = inject(APP_CONFIG);

  const token = authState.token();
  const targetsOwnApi = req.url.startsWith(config.apiBaseUrl);
  const authReq =
    token && targetsOwnApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  const isSilentRefresh = req.url === `${config.apiBaseUrl}${REFRESH_PATH}`;
  const concernsTeacherSession = !req.headers.has(ENTETE_JETON_PARTICIPANT) && !isSilentRefresh;

  return next(authReq).pipe(
    tap({
      error: (error: { status?: number }) => {
        if (error.status === 401 && concernsTeacherSession) {
          authState.clearSession();
          redirectToLogin(router);
        }
      },
    }),
  );
};
