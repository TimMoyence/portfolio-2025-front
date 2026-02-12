import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";
import { MessageResponse } from "../models/message.response";
import { CookieConsentPayload } from "../models/cookie-consent.model";

export interface CookieConsentPort {
  recordConsent(payload: CookieConsentPayload): Observable<MessageResponse>;
}

export const COOKIE_CONSENT_PORT = new InjectionToken<CookieConsentPort>(
  "COOKIE_CONSENT_PORT",
);
