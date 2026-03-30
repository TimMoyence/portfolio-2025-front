import type { ChangeDetectorRef } from "@angular/core";
import type { Observable, Subscription } from "rxjs";
import { extractErrorMessage } from "./http-error.utils";

/**
 * Options pour {@link handleFormSubmit}.
 * Chaque callback est optionnel sauf `fallbackError`.
 */
export interface FormSubmitOptions<T> {
  onSuccess?: (result: T) => void;
  onError?: (message: string) => void;
  onComplete?: () => void;
  fallbackError: string;
}

/**
 * Souscrit a un Observable de soumission de formulaire en centralisant
 * la gestion d'erreur (extraction du message) et le rafraichissement
 * du change detector apres chaque callback.
 */
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
