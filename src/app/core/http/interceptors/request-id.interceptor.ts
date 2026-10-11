import type { HttpInterceptorFn } from '@angular/common/http';
import { creerCle } from '../../../../cours/runtime/core/cle';

export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  const cloned = req.clone({
    setHeaders: {
      'X-Request-Id': creerCle(),
    },
  });
  return next(cloned);
};
