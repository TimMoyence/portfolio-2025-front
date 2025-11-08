import { HttpInterceptorFn } from '@angular/common/http';

export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  const cloned = req.clone({
    setHeaders: {
      'X-Request-Id': id
    }
  });
  return next(cloned);
};
