import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type { Observable } from "rxjs";
import { getApiBaseUrl } from "../http/api-config";
import type { MessageResponse } from "../models/message.response";
import type { ToolkitRequest } from "../models/toolkit-request.model";
import type { LeadMagnetPort } from "../ports/lead-magnet.port";

/** Adaptateur HTTP pour le module lead-magnets. */
@Injectable()
export class LeadMagnetHttpAdapter implements LeadMagnetPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  requestToolkit(request: ToolkitRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.baseUrl}/lead-magnets/formations-toolkit`,
      request,
    );
  }
}
