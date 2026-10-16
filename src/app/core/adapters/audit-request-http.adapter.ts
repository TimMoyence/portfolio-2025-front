import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import type { z } from 'zod';
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
import {
  auditCreeServi,
  auditEchoueServi,
  auditExpireServi,
  auditTermineServi,
  battementServi,
  progressionDAuditServie,
  resumeDAuditServi,
} from './site-schemas';

const SCHEMAS_DU_FLUX = {
  progress: progressionDAuditServie,
  completed: auditTermineServi,
  failed: auditEchoueServi,
  timeout: auditExpireServi,
  heartbeat: battementServi,
} satisfies Record<AuditStreamEvent['type'], z.ZodType>;

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
    return this.http.post<unknown>(`${this.baseUrl}/audits`, payload).pipe(luPar(auditCreeServi));
  }

  getSummary(auditId: string): Observable<AuditSummaryResponse> {
    return this.http
      .get<unknown>(`${this.baseUrl}/audits/${encodeURIComponent(auditId)}/summary`)
      .pipe(luPar(resumeDAuditServi));
  }

  stream(auditId: string): Observable<AuditStreamEvent> {
    if (!this.isBrowser) return EMPTY;

    return new Observable<AuditStreamEvent>((subscriber) => {
      const streamUrl = `${this.baseUrl}/audits/${encodeURIComponent(auditId)}/stream`;
      const source = new EventSource(streamUrl);

      const relayer = (type: AuditStreamEvent['type'], event: MessageEvent): boolean => {
        const data = jsonOuNull(event.data);
        if (!data) {
          return false;
        }
        const lu = SCHEMAS_DU_FLUX[type].safeParse(data);
        if (!lu.success) {
          subscriber.error(lu.error);
          return false;
        }
        subscriber.next({ type, data: lu.data } as AuditStreamEvent);
        return true;
      };

      source.addEventListener('progress', (event) => relayer('progress', event));
      source.addEventListener('heartbeat', (event) => relayer('heartbeat', event));
      source.addEventListener('completed', (event) => {
        if (relayer('completed', event)) {
          subscriber.complete();
        }
      });
      for (const fin of ['failed', 'timeout'] as const) {
        source.addEventListener(fin, (event) => {
          relayer(fin, event);
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
