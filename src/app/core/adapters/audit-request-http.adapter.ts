import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import {
  zAuditRequestResponseDto,
  zAuditsControllerStreamResponse,
  zAuditSummaryResponseDto,
} from '../../../../contrat/zod.gen';
import { getApiBaseUrl } from '../http/api-config';
import { jsonOuNull } from '../../../cours/runtime/core/valeurs';
import type {
  AuditCreateResponse,
  AuditRequestPayload,
  AuditStreamEvent,
  AuditSummaryResponse,
} from '../models/audit-request.model';
import type { AuditRequestPort } from '../ports/audit-request.port';
import { luPar } from './lu-par';

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
    return this.http
      .post<unknown>(`${this.baseUrl}/audits`, payload)
      .pipe(luPar(zAuditRequestResponseDto));
  }

  getSummary(auditId: string): Observable<AuditSummaryResponse> {
    return this.http
      .get<unknown>(`${this.baseUrl}/audits/${encodeURIComponent(auditId)}/summary`)
      .pipe(luPar(zAuditSummaryResponseDto));
  }

  stream(auditId: string): Observable<AuditStreamEvent> {
    if (!this.isBrowser) return EMPTY;

    return new Observable<AuditStreamEvent>((subscriber) => {
      const streamUrl = `${this.baseUrl}/audits/${encodeURIComponent(auditId)}/stream`;
      const source = new EventSource(streamUrl);

      const relayer = (event: AuditStreamEvent['event'], message: MessageEvent): boolean => {
        const data = jsonOuNull(message.data);
        if (!data) {
          return false;
        }
        const lu = zAuditsControllerStreamResponse.safeParse({ event, data });
        if (!lu.success) {
          subscriber.error(lu.error);
          return false;
        }
        subscriber.next(lu.data);
        return true;
      };

      source.addEventListener('progress', (message) => relayer('progress', message));
      source.addEventListener('heartbeat', (message) => relayer('heartbeat', message));
      source.addEventListener('completed', (message) => {
        if (relayer('completed', message)) {
          subscriber.complete();
        }
      });
      for (const fin of ['failed', 'timeout'] as const) {
        source.addEventListener(fin, (message) => {
          relayer(fin, message);
          subscriber.complete();
        });
      }
      source.onerror = () => {
        subscriber.error(new Error('Audit stream disconnected'));
      };

      return () => {
        source.close();
      };
    });
  }
}
