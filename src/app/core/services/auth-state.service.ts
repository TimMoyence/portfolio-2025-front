import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { computed, signal } from '@angular/core';
import type { AuthSession, AuthUser } from '../models/auth.model';
import { AUTH_PORT, type AuthPort } from '../ports/auth.port';

const TOKEN_KEY = 'portfolio_jwt';
const REFRESH_MARGIN_S = 30;

/**
 * Le refresh token est gere exclusivement par un cookie HttpOnly securise
 * cote backend — il n'est jamais accessible en JavaScript.
 */
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly authPort = inject(AUTH_PORT, {
    optional: true,
  }) as AuthPort | null;

  private readonly destroyRef = inject(DestroyRef);

  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _isInitialized = signal(false);
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isInitialized = this._isInitialized.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.clearRefreshTimer());

    if (!this.isBrowser) {
      this._isInitialized.set(true);
    }
    afterNextRender(() => {
      this.restoreToken();
      this._isInitialized.set(true);
    });
  }

  login(session: AuthSession): void {
    this._token.set(session.accessToken);
    this._user.set(session.user);
    if (this.isBrowser) {
      localStorage.setItem(TOKEN_KEY, session.accessToken);
    }
    this.scheduleRefresh(session.expiresIn);
  }

  clearSession(): void {
    this.clearState();
  }

  logout(): void {
    try {
      this.authPort?.logout().subscribe({ error: () => {} });
    } catch {
      // Une deconnexion ne doit jamais echouer cote client. Contrepartie assumee :
      // serveur injoignable => le cookie de refresh HttpOnly survit cote serveur
      // jusqu a son expiration, alors que la session locale est deja purgee.
    } finally {
      this.clearState();
    }
  }

  hasRole(role: string): boolean {
    return this._user()?.roles?.includes(role) ?? false;
  }

  updateUser(user: AuthUser): void {
    this._user.set(user);
  }

  restoreSession(): void {
    const token = this._token();
    if (!token || !this.authPort) return;

    this.authPort.me().subscribe({
      next: (user) => this._user.set(user),
      error: () => this.clearSession(),
    });
  }

  private scheduleRefresh(expiresInSeconds: number): void {
    this.clearRefreshTimer();
    const delayMs = Math.max((expiresInSeconds - REFRESH_MARGIN_S) * 1000, 5000);
    this.refreshTimer = setTimeout(() => this.doRefresh(), delayMs);
  }

  private doRefresh(): void {
    if (!this.authPort) return;
    this.authPort.refresh().subscribe({
      next: (session) => this.login(session),
      error: () => this.clearSession(),
    });
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private clearState(): void {
    this.clearRefreshTimer();
    this._token.set(null);
    this._user.set(null);
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  private restoreToken(): void {
    if (!this.isBrowser || !this.authPort) return;
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      this._token.set(savedToken);
      this.restoreSession();
    }
  }
}
