import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { getApiBaseUrl } from "../http/api-config";
import { CookieConsentPayload } from "../models/cookie-consent.model";
import { MessageResponse } from "../models/message.response";
import { CookieConsentPort } from "../ports/cookie-consent.port";

@Injectable()
export class CookieConsentHttpAdapter implements CookieConsentPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  recordConsent(payload: CookieConsentPayload): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.baseUrl}cookie-consents`,
      payload,
    );
  }
}
