import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { computed, signal } from '@angular/core';
import { finalize, firstValueFrom } from 'rxjs';
import type { AuthSession, AuthUser } from '../models/auth.model';
import { AUTH_PORT, type AuthPort } from '../ports/auth.port';
import { VERROU_INTER_ONGLETS } from './verrou-inter-onglets';

const TOKEN_KEY = 'portfolio_jwt';
const EXPIRY_KEY = 'portfolio_jwt_expire_le';
const REFRESH_LOCK = 'portfolio-auth-refresh';
const REFRESH_MARGIN_MS = 30_000;
const REFRESH_MIN_DELAY_MS = 5_000;
const RETRY_INITIAL_DELAY_MS = 2_000;
const RETRY_MAX_DELAY_MS = 30_000;
const RETRY_MAX_ATTEMPTS = 5;

function httpStatusOf(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

function isTransientFailure(status: number | null): boolean {
  return status === 0 || (status !== null && status >= 500);
}

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly authPort = inject(AUTH_PORT, {
    optional: true,
  }) as AuthPort | null;
  private readonly crossWindowLock = inject(VERROU_INTER_ONGLETS);

  private readonly destroyRef = inject(DestroyRef);

  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _isInitialized = signal(false);
  private readonly _isUserLoading = signal(false);
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshAttempts = 0;

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isInitialized = this._isInitialized.asReadonly();
  readonly isSessionResolved = computed(
    () => this._user() !== null || (this._isInitialized() && !this._isUserLoading()),
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.clearRefreshTimer());

    if (this.isBrowser) {
      this.followOtherWindows();
    } else {
      this._isInitialized.set(true);
    }
    afterNextRender(() => {
      this.restoreToken();
      this._isInitialized.set(true);
    });
  }

  login(session: AuthSession): void {
    const expiresAt = Date.now() + session.expiresIn * 1000;
    this._user.set(session.user);
    if (this.isBrowser) {
      localStorage.setItem(EXPIRY_KEY, String(expiresAt));
      localStorage.setItem(TOKEN_KEY, session.accessToken);
    }
    this.adoptToken(session.accessToken, expiresAt);
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

    this._isUserLoading.set(true);
    this.authPort
      .me()
      .pipe(finalize(() => this._isUserLoading.set(false)))
      .subscribe({
        next: (user) => {
          this._user.set(user);
          this.armRefresh();
        },
        error: () => this.clearSession(),
      });
  }

  private armRefresh(): void {
    if (this.refreshTimer === null) {
      this.scheduleRefresh(this.readStoredExpiry());
    }
  }

  private scheduleRefresh(expiresAt: number | null): void {
    const delayMs =
      expiresAt === null
        ? REFRESH_MIN_DELAY_MS
        : Math.max(expiresAt - REFRESH_MARGIN_MS - Date.now(), REFRESH_MIN_DELAY_MS);
    this.planRefresh(delayMs);
  }

  private planRefresh(delayMs: number): void {
    this.clearRefreshTimer();
    this.refreshTimer = setTimeout(() => this.doRefresh(), delayMs);
  }

  private doRefresh(): void {
    this.refreshTimer = null;
    this.crossWindowLock(REFRESH_LOCK, () => this.refreshUnderLock()).catch((error: unknown) =>
      this.onRefreshError(error),
    );
  }

  private async refreshUnderLock(): Promise<void> {
    if (this._token() === null || this.authPort === null || this.adoptStoredToken()) {
      return;
    }
    try {
      this.login(await firstValueFrom(this.authPort.refresh()));
    } catch (error) {
      this.onRefreshError(error);
    }
  }

  private onRefreshError(error: unknown): void {
    const status = httpStatusOf(error);
    if (status === 401) {
      this.clearSession();
      return;
    }
    if (!isTransientFailure(status) || this.refreshAttempts >= RETRY_MAX_ATTEMPTS) {
      return;
    }
    const delayMs = Math.min(
      RETRY_INITIAL_DELAY_MS * 2 ** this.refreshAttempts,
      RETRY_MAX_DELAY_MS,
    );
    this.refreshAttempts += 1;
    this.planRefresh(delayMs);
  }

  private adoptStoredToken(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    const stored = localStorage.getItem(TOKEN_KEY);
    const expiresAt = this.readStoredExpiry();
    if (
      stored === null ||
      stored === this._token() ||
      expiresAt === null ||
      expiresAt - Date.now() <= REFRESH_MARGIN_MS
    ) {
      return false;
    }
    this.adoptToken(stored, expiresAt);
    return true;
  }

  private adoptToken(token: string, expiresAt: number | null): void {
    this._token.set(token);
    this.refreshAttempts = 0;
    this.scheduleRefresh(expiresAt);
  }

  private followOtherWindows(): void {
    const onStorage = (event: StorageEvent): void => {
      const current = this._token();
      if (
        event.key !== TOKEN_KEY ||
        event.newValue === null ||
        current === null ||
        event.newValue === current
      ) {
        return;
      }
      this.adoptToken(event.newValue, this.readStoredExpiry());
    };
    window.addEventListener('storage', onStorage);
    this.destroyRef.onDestroy(() => window.removeEventListener('storage', onStorage));
  }

  private readStoredExpiry(): number | null {
    if (!this.isBrowser) {
      return null;
    }
    const expiresAt = Number(localStorage.getItem(EXPIRY_KEY));
    return Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : null;
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private clearState(): void {
    this.clearRefreshTimer();
    this.refreshAttempts = 0;
    this._token.set(null);
    this._user.set(null);
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
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
