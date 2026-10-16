import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

export interface ProblemeHttp {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly code?: string;
}

export function buildProblemeHttp(overrides: Partial<ProblemeHttp> = {}): ProblemeHttp {
  const status = overrides.status ?? 409;
  return {
    type: `https://httpstatuses.com/${status}`,
    title: 'Conflict',
    status,
    detail: 'Conflit avec la ressource existante',
    ...overrides,
  };
}

export function refusDuBack(
  status: number,
  detail: string | readonly string[] = 'Texte servi par le back',
  entetes: Readonly<Record<string, string>> = {},
): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    headers: new HttpHeaders(entetes),
    url: 'https://asilidesign.fr/api/v1/portfolio25',
    error: { ...buildProblemeHttp({ status }), detail },
  });
}
