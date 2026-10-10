import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { getApiBaseUrl } from '../http/api-config';
import { jsonOuNull } from '../../../cours/runtime/core/valeurs';
import type {
  AuditCreateResponse,
  AuditRequestPayload,
  AuditStreamEvent,
  AuditSummaryResponse,
} from '../models/audit-request.model';
import type { AuditRequestPort } from '../ports/audit-request.port';

@Injectable()
export class AuditRequestHttpAdapter implements AuditRequestPort {
  private readonly baseUrl = getApiBaseUrl();
  private readonly isBrowser: boolean;

  constructor(
    private readonly http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  submit(payload: AuditRequestPayload): Observable<AuditCreateResponse> {
    return this.http.post<AuditCreateResponse>(`${this.baseUrl}/audits`, payload);
  }

  getSummary(auditId: string): Observable<AuditSummaryResponse> {
    return this.http.get<AuditSummaryResponse>(
      `${this.baseUrl}/audits/${encodeURIComponent(auditId)}/summary`,
    );
  }

  stream(auditId: string): Observable<AuditStreamEvent> {
    if (!this.isBrowser) return EMPTY;

    return new Observable<AuditStreamEvent>((subscriber) => {
      const streamUrl = `${this.baseUrl}/audits/${encodeURIComponent(auditId)}/stream`;
      const source = new EventSource(streamUrl);

      const relayer = (type: AuditStreamEvent['type'], event: MessageEvent): boolean => {
        const data = jsonOuNull(event.data);
        if (data) {
          subscriber.next({ type, data } as AuditStreamEvent);
        }
        return Boolean(data);
      };

      source.addEventListener('progress', (event) => relayer('progress', event));
      source.addEventListener('heartbeat', (event) => relayer('heartbeat', event));
      source.addEventListener('completed', (event) => {
        if (relayer('completed', event)) {
          subscriber.complete();
        }
      });
      source.addEventListener('failed', (event) => {
        relayer('failed', event);
        subscriber.complete();
      });
      source.onerror = () => {
        subscriber.error(new Error('Audit stream disconnected'));
      };

      return () => {
        source.close();
      };
    });
  }
}
