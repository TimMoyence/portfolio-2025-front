import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { computed, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { finalize, firstValueFrom, timeout } from 'rxjs';
import type { AuthSession, AuthUser } from '../models/auth.model';
import { AUTH_PORT, type AuthPort } from '../ports/auth.port';
import { VERROU_INTER_ONGLETS } from './verrou-inter-onglets';

const REFRESH_LOCK = 'portfolio-auth-refresh';
const REFRESH_MARGIN_MS = 30_000;
const REFRESH_MIN_DELAY_MS = 5_000;
const RETRY_INITIAL_DELAY_MS = 2_000;
const RETRY_MAX_DELAY_MS = 30_000;
const RETRY_MAX_ATTEMPTS = 5;
const THROTTLED_RETRY_MIN_MS = 15 * 60_000;
const THROTTLED_RETRY_MAX_MS = 60 * 60_000;
const ME_TIMEOUT_MS = 10_000;

function httpStatusOf(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

function throttledRetryDelayMs(error: unknown): number {
  const retryAfterS =
    error instanceof HttpErrorResponse ? Number(error.headers.get('Retry-After')) : 0;
  const requestedMs = Number.isFinite(retryAfterS) ? retryAfterS * 1000 : 0;
  return Math.min(Math.max(requestedMs, THROTTLED_RETRY_MIN_MS), THROTTLED_RETRY_MAX_MS);
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
  private readonly _isSessionChecked = signal(false);
  private readonly _isUserLoading = signal(false);
  private readonly _isRestoreFailed = signal(false);
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshAttempts = 0;
  private accessTokenExpiresAt: number | null = null;

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isInitialized = this._isInitialized.asReadonly();
  readonly isRestoreFailed = this._isRestoreFailed.asReadonly();
  readonly isSessionCheckComplete = computed(
    () => this._isSessionChecked() && !this._isUserLoading(),
  );
  readonly isSessionResolved = computed(
    () =>
      this._isSessionChecked() &&
      (this._user() !== null ||
        (this._isInitialized() && !this._isUserLoading() && !this._isRestoreFailed())),
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.clearRefreshTimer());

    if (!this.isBrowser) {
      this._isSessionChecked.set(true);
      this._isInitialized.set(true);
    }
    afterNextRender(() => {
      this._isInitialized.set(true);
    });
  }

  login(session: AuthSession): void {
    const expiresAt = Date.now() + session.expiresIn * 1000;
    this._user.set(session.user);
    this._isSessionChecked.set(true);
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
    if (!this.authPort || this._isUserLoading()) return;

    this._isRestoreFailed.set(false);
    this._isUserLoading.set(true);
    if (token === null) {
      this.suivreLaRestauration(this.authPort.refresh(), (session: AuthSession) =>
        this.login(session),
      );
      return;
    }

    this.suivreLaRestauration(this.authPort.me(), (user: AuthUser) => {
      this._user.set(user);
      this.armRefresh();
    });
  }

  private suivreLaRestauration<Resultat>(
    restauration: Observable<Resultat>,
    appliquer: (resultat: Resultat) => void,
  ): void {
    restauration
      .pipe(
        timeout(ME_TIMEOUT_MS),
        finalize(() => this._isUserLoading.set(false)),
      )
      .subscribe({
        next: appliquer,
        error: (error: unknown) => this.onRestoreError(error),
      });
  }

  private onRestoreError(error: unknown): void {
    const status = httpStatusOf(error);
    this._isSessionChecked.set(true);
    if (status === 401 || status === 403) {
      this.clearSession();
      return;
    }
    this._isRestoreFailed.set(true);
  }

  private armRefresh(): void {
    if (this.refreshTimer === null) {
      this.scheduleRefresh(this.accessTokenExpiresAt);
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
    if (this._token() === null || this.authPort === null) {
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
    if (status === 429) {
      this.planRefresh(throttledRetryDelayMs(error));
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

  private adoptToken(token: string, expiresAt: number | null): void {
    this._token.set(token);
    this.accessTokenExpiresAt = expiresAt;
    this.refreshAttempts = 0;
    this.scheduleRefresh(expiresAt);
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
    this._isRestoreFailed.set(false);
    this._isSessionChecked.set(true);
    this._token.set(null);
    this._user.set(null);
    this.accessTokenExpiresAt = null;
  }
}
