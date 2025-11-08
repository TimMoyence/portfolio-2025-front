import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Todo : integrate a toast service to show user-friendly error messages 
      console.error('[HTTP ERROR]', error.status, error.message);
      // you could map to a user-friendly error
      return throwError(() => error);
    })
  );
};
