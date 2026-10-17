import type { HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { APP_CONFIG } from '../../config/app-config.token';
import { AuthStateService, type IssueDuRafraichissement } from '../../services/auth-state.service';
import { ENTETE_JETON_PARTICIPANT } from '../../../../cours/runtime/core/jeton-participant';
import { enteteDAutorisation } from '../entete-d-autorisation';

const LOGIN_URL = '/login';
const REFRESH_PATH = '/auth/refresh';
const DEFI_DU_JETON_DE_SESSION = /^Bearer\b/i;
const ROUTES_QUI_JUGENT_DES_IDENTIFIANTS: readonly string[] = [
  '/auth/login',
  '/auth/google',
  '/auth/change-password',
  '/auth/set-password',
  '/auth/logout',
];

type Rafraichissement = 'a-tenter' | IssueDuRafraichissement;

function refuseLeJetonDeSession(error: unknown, route: string): error is HttpErrorResponse {
  if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
    return false;
  }
  const defi = error.headers.get('WWW-Authenticate');
  return defi === null
    ? !ROUTES_QUI_JUGENT_DES_IDENTIFIANTS.includes(route)
    : DEFI_DU_JETON_DE_SESSION.test(defi);
}

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

  const targetsOwnApi = req.url.startsWith(config.apiBaseUrl);
  const route = req.url.slice(config.apiBaseUrl.length);
  const isSilentRefresh = req.url === `${config.apiBaseUrl}${REFRESH_PATH}`;
  const concernsTeacherSession =
    targetsOwnApi && !req.headers.has(ENTETE_JETON_PARTICIPANT) && !isSilentRefresh;

  const apresUnRefus = (
    error: unknown,
    rafraichissement: Rafraichissement,
  ): Observable<HttpEvent<unknown>> => {
    if (rafraichissement === 'a-tenter') {
      return from(authState.rafraichirLaSession()).pipe(
        switchMap((issue) => (issue === 'reussi' ? envoyer(issue) : apresUnRefus(error, issue))),
      );
    }
    if (rafraichissement !== 'injoignable') {
      authState.clearSession();
      redirectToLogin(router);
    }
    return throwError(() => error);
  };

  const envoyer = (rafraichissement: Rafraichissement): Observable<HttpEvent<unknown>> => {
    const token = authState.jetonAExpire() ? null : authState.token();
    const authReq =
      token && targetsOwnApi ? req.clone({ setHeaders: enteteDAutorisation(token) }) : req;
    return next(authReq).pipe(
      catchError((error: unknown) =>
        concernsTeacherSession && refuseLeJetonDeSession(error, route)
          ? apresUnRefus(error, rafraichissement)
          : throwError(() => error),
      ),
    );
  };

  if (concernsTeacherSession && authState.jetonAExpire()) {
    return from(authState.rafraichirLaSession()).pipe(switchMap((issue) => envoyer(issue)));
  }
  return envoyer('a-tenter');
};
