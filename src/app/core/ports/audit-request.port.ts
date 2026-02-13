import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";
import { AuditRequestPayload } from "../models/audit-request.model";
import { MessageResponse } from "../models/message.response";

export interface AuditRequestPort {
  submit(payload: AuditRequestPayload): Observable<MessageResponse>;
}

export const AUDIT_REQUEST_PORT = new InjectionToken<AuditRequestPort>(
  "AUDIT_REQUEST_PORT",
);
