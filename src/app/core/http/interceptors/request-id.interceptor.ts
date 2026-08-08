import type { HttpInterceptorFn } from '@angular/common/http';

const FALLBACK_ID_BYTES = 16;

function generateRequestId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(FALLBACK_ID_BYTES));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  const cloned = req.clone({
    setHeaders: {
      'X-Request-Id': generateRequestId(),
    },
  });
  return next(cloned);
};
