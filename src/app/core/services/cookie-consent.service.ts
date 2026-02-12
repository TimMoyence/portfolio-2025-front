import { isPlatformBrowser } from "@angular/common";
import {
  Inject,
  Injectable,
  LOCALE_ID,
  PLATFORM_ID,
} from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { APP_CONFIG } from "../config/app-config.token";
import { AppConfig } from "../config/app-config.model";
import {
  CookieConsentAction,
  CookieConsentPayload,
  CookieConsentPreferences,
  CookieConsentSource,
  CookieConsentState,
} from "../models/cookie-consent.model";
import { MessageResponse } from "../models/message.response";
import {
  COOKIE_CONSENT_PORT,
  CookieConsentPort,
} from "../ports/cookie-consent.port";

@Injectable({
  providedIn: "root",
})
export class CookieConsentService {
  private readonly consentCookieName = "moyence_cookie_consent";
  private readonly defaultPreferences: CookieConsentPreferences = {
    essential: true,
    preferences: false,
    analytics: false,
    marketing: false,
  };
  private readonly isBrowser: boolean;
  private readonly consentSubject = new BehaviorSubject<CookieConsentState | null>(
    null,
  );

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    @Inject(LOCALE_ID) private readonly localeId: string,
    @Inject(APP_CONFIG) private readonly appConfig: AppConfig,
    @Inject(COOKIE_CONSENT_PORT) private readonly consentPort: CookieConsentPort,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.consentSubject.next(this.readConsent());
    }
  }

  get consentChanges$(): Observable<CookieConsentState | null> {
    return this.consentSubject.asObservable();
  }

  isConsentRequired(): boolean {
    return (
      this.appConfig.gdpr?.regionScope === "EU_UK" && this.isLocaleEligible()
    );
  }

  shouldShowBanner(): boolean {
    if (!this.isBrowser || !this.isConsentRequired()) return false;
    return this.consentSubject.value === null;
  }

  getPreferences(): CookieConsentPreferences {
    const stored = this.consentSubject.value?.preferences;
    return stored ? this.normalizePreferences(stored) : { ...this.defaultPreferences };
  }

  getDefaultPreferences(): CookieConsentPreferences {
    return { ...this.defaultPreferences };
  }

  saveConsent(
    preferences: CookieConsentPreferences,
    source: CookieConsentSource,
    action: CookieConsentAction,
  ): Observable<MessageResponse> {
    const normalized = this.normalizePreferences(preferences);
    const state: CookieConsentState = {
      policyVersion: this.getPolicyVersion(),
      locale: this.localeId,
      region: this.getRegionScope(),
      preferences: normalized,
      updatedAt: new Date().toISOString(),
    };

    if (this.isBrowser) {
      this.writeConsent(state);
    }

    this.consentSubject.next(state);

    const payload: CookieConsentPayload = {
      policyVersion: state.policyVersion,
      locale: state.locale,
      region: state.region,
      source,
      action,
      preferences: normalized,
    };

    return this.consentPort.recordConsent(payload);
  }

  withdrawConsent(): Observable<MessageResponse> {
    return this.saveConsent(
      this.getDefaultPreferences(),
      "settings",
      "withdraw",
    );
  }

  private getPolicyVersion(): string {
    return this.appConfig.gdpr?.policyVersion ?? "2026-02-11";
  }

  private getRegionScope(): string {
    return this.appConfig.gdpr?.regionScope ?? "EU_UK";
  }

  private isLocaleEligible(): boolean {
    const locale = (this.localeId ?? "").toLowerCase();
    const base = locale.split("-")[0];
    return base === "fr" || base === "en";
  }

  private normalizePreferences(
    preferences: CookieConsentPreferences,
  ): CookieConsentPreferences {
    return {
      essential: true,
      preferences: Boolean(preferences.preferences),
      analytics: false,
      marketing: false,
    };
  }

  private readConsent(): CookieConsentState | null {
    const raw = this.getCookie(this.consentCookieName);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(decodeURIComponent(raw)) as CookieConsentState;
      if (!parsed?.preferences) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private writeConsent(state: CookieConsentState): void {
    const value = encodeURIComponent(JSON.stringify(state));
    const maxAgeDays = this.appConfig.gdpr?.cookieMaxAgeDays ?? 365;
    const maxAge = maxAgeDays * 24 * 60 * 60;
    const secure = this.appConfig.production ? "; Secure" : "";
    document.cookie = `${this.consentCookieName}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
  }

  private getCookie(name: string): string | null {
    if (!this.isBrowser) return null;
    const cookies = document.cookie.split(";");
    const prefix = `${name}=`;

    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith(prefix)) {
        return trimmed.substring(prefix.length);
      }
    }

    return null;
  }
}
