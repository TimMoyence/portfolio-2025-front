import { isPlatformBrowser } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { EMPTY, Observable } from "rxjs";
import { getApiBaseUrl } from "../http/api-config";
import type {
  AuditCompletedEvent,
  AuditFailedEvent,
  AuditCreateResponse,
  AuditProgressEvent,
  AuditRequestPayload,
  AuditStreamEvent,
  AuditSummaryResponse,
} from "../models/audit-request.model";
import type { AuditRequestPort } from "../ports/audit-request.port";

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
    return this.http.post<AuditCreateResponse>(
      `${this.baseUrl}audits`,
      payload,
    );
  }

  getSummary(auditId: string): Observable<AuditSummaryResponse> {
    return this.http.get<AuditSummaryResponse>(
      `${this.baseUrl}audits/${encodeURIComponent(auditId)}/summary`,
    );
  }

  stream(auditId: string): Observable<AuditStreamEvent> {
    // Guard SSR : EventSource n'est pas disponible cote serveur
    if (!this.isBrowser) return EMPTY;

    return new Observable<AuditStreamEvent>((subscriber) => {
      const streamUrl = `${this.baseUrl}audits/${encodeURIComponent(auditId)}/stream`;
      const source = new EventSource(streamUrl);

      const parsePayload = (raw: MessageEvent): unknown => {
        try {
          return JSON.parse(raw.data);
        } catch {
          return null;
        }
      };

      const onProgress = (event: Event) => {
        const payload = parsePayload(event as MessageEvent);
        if (!payload) return;
        subscriber.next({
          type: "progress",
          data: payload as AuditProgressEvent,
        });
      };

      const onCompleted = (event: Event) => {
        const payload = parsePayload(event as MessageEvent);
        if (!payload) return;
        subscriber.next({
          type: "completed",
          data: payload as AuditCompletedEvent,
        });
        source.close();
        subscriber.complete();
      };

      const onFailed = (event: Event) => {
        const payload = parsePayload(event as MessageEvent);
        if (payload) {
          subscriber.next({
            type: "failed",
            data: payload as AuditFailedEvent,
          });
        }
        source.close();
        subscriber.complete();
      };

      const onHeartbeat = (event: Event) => {
        const payload = parsePayload(event as MessageEvent);
        if (!payload) return;
        subscriber.next({
          type: "heartbeat",
          data: payload as { ts: string },
        });
      };

      source.addEventListener("progress", onProgress);
      source.addEventListener("completed", onCompleted);
      source.addEventListener("failed", onFailed);
      source.addEventListener("heartbeat", onHeartbeat);
      source.onerror = () => {
        source.close();
        subscriber.error(new Error("Audit stream disconnected"));
      };

      return () => {
        source.close();
      };
    });
  }
}
