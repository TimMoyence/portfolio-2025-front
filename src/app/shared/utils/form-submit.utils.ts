import type { ChangeDetectorRef } from '@angular/core';
import type { Observable, Subscription } from 'rxjs';
import { extractErrorMessage } from './http-error.utils';

export interface FormSubmitOptions<T> {
  onSuccess?: (result: T) => void;
  onError?: (message: string) => void;
  onComplete?: () => void;
  fallbackError: string;
}

export function handleFormSubmit<T>(
  source$: Observable<T>,
  cdr: ChangeDetectorRef,
  options: FormSubmitOptions<T>,
): Subscription {
  return source$.subscribe({
    next: (result) => {
      options.onSuccess?.(result);
      cdr.markForCheck();
    },
    error: (error: unknown) => {
      const message = extractErrorMessage(error) ?? options.fallbackError;
      options.onError?.(message);
      cdr.markForCheck();
    },
    complete: () => {
      options.onComplete?.();
      cdr.markForCheck();
    },
  });
}
