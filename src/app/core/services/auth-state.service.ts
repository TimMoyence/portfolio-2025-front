import { isPlatformBrowser } from "@angular/common";
import { Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { computed, signal } from "@angular/core";
import type { AuthSession, AuthUser } from "../models/auth.model";
import { AUTH_PORT, type AuthPort } from "../ports/auth.port";

const TOKEN_KEY = "portfolio_jwt";

/**
 * Service central de gestion de l'etat d'authentification.
 * Stocke le token JWT en localStorage et expose des signals reactifs.
 */
@Injectable({ providedIn: "root" })
export class AuthStateService {
  private readonly isBrowser: boolean;

  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<AuthUser | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    @Inject(AUTH_PORT) private readonly authPort: AuthPort,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.restoreToken();
  }

  login(session: AuthSession): void {
    this._token.set(session.accessToken);
    this._user.set(session.user);
    if (this.isBrowser) {
      localStorage.setItem(TOKEN_KEY, session.accessToken);
    }
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  hasRole(role: string): boolean {
    return this._user()?.roles?.includes(role) ?? false;
  }

  /** Restaure la session depuis le token en localStorage via GET /auth/me. */
  restoreSession(): void {
    const token = this._token();
    if (!token) return;

    this.authPort.me().subscribe({
      next: (user) => this._user.set(user),
      error: () => this.logout(),
    });
  }

  private restoreToken(): void {
    if (!this.isBrowser) return;
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      this._token.set(saved);
      this.restoreSession();
    }
  }
}
