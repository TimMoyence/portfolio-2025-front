import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  AuditCreateResponse,
  AuditRequestPayload,
  AuditStreamEvent,
  AuditSummaryResponse,
} from "../models/audit-request.model";
import { AUDIT_REQUEST_PORT, AuditRequestPort } from "../ports/audit-request.port";

@Injectable({
  providedIn: "root",
})
export class AuditRequestService {
  constructor(
    @Inject(AUDIT_REQUEST_PORT) private readonly auditPort: AuditRequestPort,
  ) {}

  submit(payload: AuditRequestPayload): Observable<AuditCreateResponse> {
    return this.auditPort.submit(payload);
  }

  getSummary(auditId: string): Observable<AuditSummaryResponse> {
    return this.auditPort.getSummary(auditId);
  }

  stream(auditId: string): Observable<AuditStreamEvent> {
    return this.auditPort.stream(auditId);
  }
}
