import { isPlatformBrowser } from "@angular/common";
import {
  afterNextRender,
  DestroyRef,
  Injectable,
  PLATFORM_ID,
  inject,
} from "@angular/core";
import { computed, signal } from "@angular/core";
import type { AuthSession, AuthUser } from "../models/auth.model";
import { AUTH_PORT, type AuthPort } from "../ports/auth.port";

const TOKEN_KEY = "portfolio_jwt";
const REFRESH_MARGIN_S = 30;

/**
 * Service central de gestion de l'etat d'authentification.
 * Stocke le token JWT en localStorage et expose des signals reactifs.
 * Le refresh token est gere exclusivement par un cookie HttpOnly securise
 * cote backend — il n'est jamais accessible en JavaScript.
 * Utilise afterNextRender pour restaurer la session apres l'hydratation SSR.
 */
@Injectable({ providedIn: "root" })
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
  /** Indique si la restauration de session est terminee (true immediatement cote SSR). */
  readonly isInitialized = this._isInitialized.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.clearRefreshTimer());

    // Cote serveur, pas de localStorage : on considere l'initialisation terminee
    if (!this.isBrowser) {
      this._isInitialized.set(true);
    }
    // afterNextRender garantit l'execution cote client apres l'hydratation SSR
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

  /** Logout silencieux (401 interceptor) : nettoie sans appel backend. */
  logout(): void {
    this.clearState();
  }

  /** Logout complet : revoque le refresh token cote backend puis nettoie le state. */
  logoutFull(): void {
    if (this.authPort) {
      this.authPort.logout().subscribe({ error: () => {} });
    }
    this.clearState();
  }

  hasRole(role: string): boolean {
    return this._user()?.roles?.includes(role) ?? false;
  }

  /** Met a jour l'utilisateur courant dans le state (apres un PATCH profil par ex.). */
  updateUser(user: AuthUser): void {
    this._user.set(user);
  }

  /** Restaure la session depuis le token en localStorage via GET /auth/me. */
  restoreSession(): void {
    const token = this._token();
    if (!token || !this.authPort) return;

    this.authPort.me().subscribe({
      next: (user) => this._user.set(user),
      error: () => this.logout(),
    });
  }

  private scheduleRefresh(expiresInSeconds: number): void {
    this.clearRefreshTimer();
    const delayMs = Math.max(
      (expiresInSeconds - REFRESH_MARGIN_S) * 1000,
      5000,
    );
    this.refreshTimer = setTimeout(() => this.doRefresh(), delayMs);
  }

  private doRefresh(): void {
    if (!this.authPort) return;
    this.authPort.refresh().subscribe({
      next: (session) => this.login(session),
      error: () => this.logout(),
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
