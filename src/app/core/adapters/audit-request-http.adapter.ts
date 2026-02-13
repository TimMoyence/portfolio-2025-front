import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { getApiBaseUrl } from "../http/api-config";
import { AuditRequestPayload } from "../models/audit-request.model";
import { MessageResponse } from "../models/message.response";
import { AuditRequestPort } from "../ports/audit-request.port";

@Injectable()
export class AuditRequestHttpAdapter implements AuditRequestPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  submit(payload: AuditRequestPayload): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.baseUrl}audit-requests`,
      payload,
    );
  }
}
