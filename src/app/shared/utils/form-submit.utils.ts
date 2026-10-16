import { HttpErrorResponse } from '@angular/common/http';
import type { ChangeDetectorRef } from '@angular/core';
import type { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs';

export type MessagesDeRefus = Readonly<Partial<Record<number, string>>>;

export const INFORMATIONS_REFUSEES = $localize`:@@formulaireRefusInformations:Certaines informations ont été refusées : vérifiez les champs et réessayez.`;

export const MOT_DE_PASSE_NEUF_REFUSE = $localize`:@@formulaireRefusMotDePasseNeuf:Le nouveau mot de passe n’a pas été accepté : il doit respecter la règle indiquée.`;

export const ADRESSE_NON_VERIFIEE = $localize`:@@formulaireRefusAdresseNonVerifiee:Votre adresse e-mail n’est pas encore vérifiée : ouvrez le lien reçu par e-mail pour activer votre compte.`;

const REFUS_COMMUNS: MessagesDeRefus = {
  403: ADRESSE_NON_VERIFIEE,
  429: $localize`:@@formulaireRefusTropDeTentatives:Trop de tentatives en peu de temps : patientez quelques minutes avant de réessayer.`,
};

function statutDuRefus(erreur: unknown): number {
  return erreur instanceof HttpErrorResponse ? erreur.status : 0;
}

function messageDuStatut(messages: MessagesDeRefus, statut: number): string | undefined {
  return Object.hasOwn(messages, statut) ? messages[statut] : undefined;
}

export function messageDuRefus(erreur: unknown, refus: MessagesDeRefus, repli: string): string {
  const statut = statutDuRefus(erreur);
  return messageDuStatut(refus, statut) ?? messageDuStatut(REFUS_COMMUNS, statut) ?? repli;
}

export interface FormSubmitOptions<T> {
  onSuccess?: (result: T) => void;
  onError?: (message: string, statut: number) => void;
  onComplete?: () => void;
  finalement?: () => void;
  refus?: MessagesDeRefus;
  fallbackError: string;
}

export function handleFormSubmit<T>(
  source$: Observable<T>,
  cdr: ChangeDetectorRef,
  options: FormSubmitOptions<T>,
): Subscription {
  return source$
    .pipe(
      finalize(() => {
        options.finalement?.();
        cdr.markForCheck();
      }),
    )
    .subscribe({
      next: (result) => {
        options.onSuccess?.(result);
        cdr.markForCheck();
      },
      error: (error: unknown) => {
        options.onError?.(
          messageDuRefus(error, options.refus ?? {}, options.fallbackError),
          statutDuRefus(error),
        );
        cdr.markForCheck();
      },
      complete: () => {
        options.onComplete?.();
        cdr.markForCheck();
      },
    });
}
