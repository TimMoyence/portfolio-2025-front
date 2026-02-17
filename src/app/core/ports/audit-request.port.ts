import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";
import {
  AuditCreateResponse,
  AuditRequestPayload,
  AuditStreamEvent,
  AuditSummaryResponse,
} from "../models/audit-request.model";

export interface AuditRequestPort {
  submit(payload: AuditRequestPayload): Observable<AuditCreateResponse>;
  getSummary(auditId: string): Observable<AuditSummaryResponse>;
  stream(auditId: string): Observable<AuditStreamEvent>;
}

export const AUDIT_REQUEST_PORT = new InjectionToken<AuditRequestPort>(
  "AUDIT_REQUEST_PORT",
);
