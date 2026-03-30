import type {
  HttpErrorResponse,
  HttpInterceptorFn,
} from "@angular/common/http";
import { catchError, throwError } from "rxjs";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Service de notification (toast) non encore implémenté.
      // L'erreur est propagée telle quelle pour être traitée par l'appelant.
      return throwError(() => error);
    }),
  );
};
