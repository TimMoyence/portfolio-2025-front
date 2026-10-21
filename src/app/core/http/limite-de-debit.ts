import { HttpErrorResponse } from '@angular/common/http';
import { STATUT_LIMITE_DE_DEBIT } from '../../../cours/runtime/core/statuts-http';
import { estPositif } from '../../../cours/runtime/core/valeurs';
import { type LimiteDeDebit, messageDeLaLimite } from '../models/limite-de-debit';

export function secondesDeRetryAfter(erreur: unknown): number | null {
  const secondes =
    erreur instanceof HttpErrorResponse ? Number(erreur.headers.get('Retry-After')) : Number.NaN;
  return estPositif(secondes) ? secondes : null;
}

export function limiteDeLaReponse(erreur: unknown): LimiteDeDebit | null {
  if (!(erreur instanceof HttpErrorResponse) || erreur.status !== STATUT_LIMITE_DE_DEBIT) {
    return null;
  }
  const secondes = secondesDeRetryAfter(erreur);
  return { minutes: secondes === null ? null : Math.ceil(secondes / 60) };
}

export function messageDeLaLimiteAtteinte(erreur: unknown): string | null {
  const limite = limiteDeLaReponse(erreur);
  return limite === null ? null : messageDeLaLimite(limite);
}
