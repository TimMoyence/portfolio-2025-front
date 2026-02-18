import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { getApiBaseUrl } from "../http/api-config";
import {
  AuditCreateResponse,
  AuditRequestPayload,
  AuditStreamEvent,
  AuditSummaryResponse,
} from "../models/audit-request.model";
import { AuditRequestPort } from "../ports/audit-request.port";

@Injectable()
export class AuditRequestHttpAdapter implements AuditRequestPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  submit(payload: AuditRequestPayload): Observable<AuditCreateResponse> {
    return this.http.post<AuditCreateResponse>(`${this.baseUrl}audits`, payload);
  }

  getSummary(auditId: string): Observable<AuditSummaryResponse> {
    return this.http.get<AuditSummaryResponse>(
      `${this.baseUrl}audits/${encodeURIComponent(auditId)}/summary`,
    );
  }

  stream(auditId: string): Observable<AuditStreamEvent> {
    return new Observable<AuditStreamEvent>((subscriber) => {
      const streamUrl = `${this.baseUrl}audits/${encodeURIComponent(auditId)}/stream`;
      const source = new EventSource(streamUrl);

      const parsePayload = (raw: MessageEvent): any => {
        try {
          return JSON.parse(raw.data);
        } catch {
          return null;
        }
      };

      const onProgress = (event: Event) => {
        const payload = parsePayload(event as MessageEvent);
        if (!payload) return;
        subscriber.next({ type: "progress", data: payload });
      };

      const onCompleted = (event: Event) => {
        const payload = parsePayload(event as MessageEvent);
        if (!payload) return;
        subscriber.next({ type: "completed", data: payload });
        source.close();
        subscriber.complete();
      };

      const onInstantSummary = (event: Event) => {
        const payload = parsePayload(event as MessageEvent);
        if (!payload) return;
        subscriber.next({ type: "instant_summary", data: payload });
      };

      const onFailed = (event: Event) => {
        const payload = parsePayload(event as MessageEvent);
        if (payload) {
          subscriber.next({ type: "failed", data: payload });
        }
        source.close();
        subscriber.complete();
      };

      const onHeartbeat = (event: Event) => {
        const payload = parsePayload(event as MessageEvent);
        if (!payload) return;
        subscriber.next({ type: "heartbeat", data: payload });
      };

      source.addEventListener("progress", onProgress);
      source.addEventListener("instant_summary", onInstantSummary);
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
