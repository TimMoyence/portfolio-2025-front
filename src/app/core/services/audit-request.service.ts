import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AuditRequestPayload } from "../models/audit-request.model";
import { MessageResponse } from "../models/message.response";
import { AUDIT_REQUEST_PORT, AuditRequestPort } from "../ports/audit-request.port";

@Injectable({
  providedIn: "root",
})
export class AuditRequestService {
  constructor(
    @Inject(AUDIT_REQUEST_PORT) private readonly auditPort: AuditRequestPort,
  ) {}

  submit(payload: AuditRequestPayload): Observable<MessageResponse> {
    return this.auditPort.submit(payload);
  }
}
