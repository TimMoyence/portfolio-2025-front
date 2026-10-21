import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { limiteDeLaReponse, secondesDeRetryAfter } from './limite-de-debit';

function refusAvec(retryAfter: string | null, status = 429): HttpErrorResponse {
  const headers =
    retryAfter === null ? new HttpHeaders() : new HttpHeaders({ 'Retry-After': retryAfter });
  return new HttpErrorResponse({ status, headers });
}

describe('secondesDeRetryAfter', () => {
  it('lit le délai en secondes de l en-tête Retry-After', () => {
    expect(secondesDeRetryAfter(refusAvec('120'))).toBe(120);
  });

  it('ne lit aucun délai absent, nul, négatif ou illisible', () => {
    for (const valeur of [null, '0', '-5', 'abc', '']) {
      expect(secondesDeRetryAfter(refusAvec(valeur)))
        .withContext(String(valeur))
        .toBeNull();
    }
  });

  it('ne lit aucun délai hors d une réponse HTTP', () => {
    expect(secondesDeRetryAfter(new Error('reseau'))).toBeNull();
  });
});

describe('limiteDeLaReponse', () => {
  it('arrondit le délai de la limite à la minute supérieure', () => {
    expect(limiteDeLaReponse(refusAvec('120'))).toEqual({ minutes: 2 });
    expect(limiteDeLaReponse(refusAvec('121'))).toEqual({ minutes: 3 });
  });

  it('ne voit pas de limite hors d un 429', () => {
    expect(limiteDeLaReponse(refusAvec('120', 503))).toBeNull();
  });
});
