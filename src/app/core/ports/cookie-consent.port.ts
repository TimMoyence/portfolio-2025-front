import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";
import type { MessageResponse } from "../models/message.response";
import type { CookieConsentPayload } from "../models/cookie-consent.model";

export interface CookieConsentPort {
  recordConsent(payload: CookieConsentPayload): Observable<MessageResponse>;
}

export const COOKIE_CONSENT_PORT = new InjectionToken<CookieConsentPort>(
  "COOKIE_CONSENT_PORT",
);
