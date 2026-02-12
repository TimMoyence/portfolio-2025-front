export type CookieConsentSource = "banner" | "settings";
export type CookieConsentAction =
  | "accept_all"
  | "essential_only"
  | "save_preferences"
  | "withdraw";

export interface CookieConsentPreferences {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentPayload {
  policyVersion: string;
  locale: string;
  region: string;
  source: CookieConsentSource;
  action: CookieConsentAction;
  preferences: CookieConsentPreferences;
}

export interface CookieConsentState {
  policyVersion: string;
  locale: string;
  region: string;
  preferences: CookieConsentPreferences;
  updatedAt: string;
}
