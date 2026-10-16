import { HttpErrorResponse } from '@angular/common/http';
import { estPositif } from '../../../cours/runtime/core/valeurs';
import { type LimiteDeDebit, messageDeLaLimite } from '../models/limite-de-debit';

export const STATUT_LIMITE_DE_DEBIT = 429;

export function limiteDeLaReponse(erreur: unknown): LimiteDeDebit | null {
  if (!(erreur instanceof HttpErrorResponse) || erreur.status !== STATUT_LIMITE_DE_DEBIT) {
    return null;
  }
  const secondes = Number(erreur.headers.get('Retry-After'));
  return { minutes: estPositif(secondes) ? Math.ceil(secondes / 60) : null };
}

export function messageDeLaLimiteAtteinte(erreur: unknown): string | null {
  const limite = limiteDeLaReponse(erreur);
  return limite === null ? null : messageDeLaLimite(limite);
}
