import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { catchError, finalize, firstValueFrom, from, map, of, tap, timeout } from 'rxjs';
import type { IssueDuRenouvellement } from '../../../cours/runtime/core/sync';
import { bornerEntre, estObjet } from '../../../cours/runtime/core/valeurs';
import type { AuthSession, AuthUser } from '../models/auth.model';
import { AUTH_PORT, type AuthPort } from '../ports/auth.port';
import {
  FENETRE_OUVERTE,
  MEMOIRE_DU_RENOUVELLEMENT,
  PLUS_LONGUE_FENETRE_MS,
} from './fenetre-de-renouvellement';
import { VERROU_INTER_ONGLETS } from './verrou-inter-onglets';

const REFRESH_LOCK = 'portfolio-auth-refresh';
const REFRESH_MARGIN_MS = 30_000;
const REFRESH_MIN_DELAY_MS = 5_000;
const RETRY_INITIAL_DELAY_MS = 2_000;
const RETRY_MAX_DELAY_MS = 30_000;
const RETRY_MAX_ATTEMPTS = 5;
const RECUL_EN_PANNE_MS = 2 * 60_000;
const THROTTLED_RETRY_MIN_MS = 15 * 60_000;
const ME_TIMEOUT_MS = 10_000;
const MARGE_D_ACHEMINEMENT_MS = 5_000;

export type IssueDuRafraichissement = IssueDuRenouvellement;

function httpStatusOf(error: unknown): number | null {
  const status = estObjet(error) ? error['status'] : undefined;
  return typeof status === 'number' ? status : null;
}

function throttledRetryDelayMs(error: unknown): number {
  const retryAfterS =
    error instanceof HttpErrorResponse ? Number(error.headers.get('Retry-After')) : 0;
  const requestedMs = Number.isFinite(retryAfterS) ? retryAfterS * 1000 : 0;
  return bornerEntre(requestedMs, THROTTLED_RETRY_MIN_MS, PLUS_LONGUE_FENETRE_MS);
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
  private readonly fenetre = inject(MEMOIRE_DU_RENOUVELLEMENT);
  private readonly router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);

  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _isInitialized = signal(false);
  private readonly _isSessionChecked = signal(false);
  private readonly _isUserLoading = signal(false);
  private readonly _isRestoreFailed = signal(false);
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private accessTokenExpiresAt: number | null = null;
  private rafraichissementEnCours: Promise<IssueDuRafraichissement> | null = null;
  private generationDeSession = 0;

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
    this.clearState();
    try {
      this.authPort?.logout().subscribe({ error: () => {} });
    } catch {
      // Une deconnexion ne doit jamais echouer cote client. Contrepartie assumee :
      // serveur injoignable => le cookie de refresh HttpOnly survit cote serveur
      // jusqu a son expiration, alors que la session locale est deja purgee.
    }
  }

  logoutEtAccueil(): void {
    this.logout();
    void this.router.navigate(['/']);
  }

  hasRole(role: string): boolean {
    return this._user()?.roles?.includes(role) ?? false;
  }

  updateUser(user: AuthUser): void {
    this._user.set(user);
  }

  jetonAExpire(): boolean {
    return (
      this._token() !== null &&
      this.accessTokenExpiresAt !== null &&
      Date.now() >= this.accessTokenExpiresAt - MARGE_D_ACHEMINEMENT_MS
    );
  }

  rafraichirLaSession(): Promise<IssueDuRafraichissement> {
    if (Date.now() < this.fenetre.lire().pasAvant) {
      return Promise.resolve('injoignable');
    }
    return this.rafraichirUneFois();
  }

  relireLeCompte(): Observable<void> {
    const port = this.authPort;
    if (port === null) return of(undefined);
    return this.relectureDuCompte(port).pipe(
      timeout(ME_TIMEOUT_MS),
      map(() => undefined),
      catchError(() => of(undefined)),
    );
  }

  private relectureDuCompte(port: AuthPort): Observable<unknown> {
    const generation = this.generationDeSession;
    if (this._token() === null) {
      return port
        .refresh()
        .pipe(tap((session) => this.connecterSiLaSessionDure(generation, session)));
    }
    if (this.jetonAExpire()) {
      return from(this.rafraichirLaSession());
    }
    return port.me().pipe(
      tap((user) => {
        if (this.laSessionDure(generation)) this._user.set(user);
      }),
    );
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
    const generation = this.generationDeSession;
    restauration
      .pipe(
        timeout(ME_TIMEOUT_MS),
        finalize(() => this._isUserLoading.set(false)),
      )
      .subscribe({
        next: (resultat) => {
          if (this.laSessionDure(generation)) appliquer(resultat);
        },
        error: (error: unknown) => {
          if (this.laSessionDure(generation)) this.onRestoreError(error);
        },
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
    this.refreshTimer = setTimeout(
      () => this.doRefresh(),
      Number.isFinite(delayMs)
        ? bornerEntre(delayMs, 0, PLUS_LONGUE_FENETRE_MS)
        : PLUS_LONGUE_FENETRE_MS,
    );
  }

  private doRefresh(): void {
    this.refreshTimer = null;
    void this.rafraichirUneFois();
  }

  private rafraichirUneFois(): Promise<IssueDuRafraichissement> {
    this.rafraichissementEnCours ??= this.crossWindowLock(REFRESH_LOCK, () =>
      this.refreshUnderLock(),
    )
      .catch((error: unknown) => this.onRefreshError(error))
      .finally(() => {
        this.rafraichissementEnCours = null;
      });
    return this.rafraichissementEnCours;
  }

  private async refreshUnderLock(): Promise<IssueDuRafraichissement> {
    const generation = this.generationDeSession;
    if (this._token() === null || this.authPort === null) {
      return 'refuse';
    }
    const { pasAvant } = this.fenetre.lire();
    if (Date.now() < pasAvant) {
      if (this.refreshTimer === null) this.planRefresh(pasAvant - Date.now());
      return 'injoignable';
    }
    try {
      const session = await firstValueFrom(this.authPort.refresh());
      return this.connecterSiLaSessionDure(generation, session) ? 'reussi' : 'refuse';
    } catch (error) {
      return this.laSessionDure(generation) ? this.onRefreshError(error) : 'refuse';
    }
  }

  private laSessionDure(generation: number): boolean {
    return generation === this.generationDeSession;
  }

  private connecterSiLaSessionDure(generation: number, session: AuthSession): boolean {
    if (!this.laSessionDure(generation)) {
      return false;
    }
    this.login(session);
    return true;
  }

  private onRefreshError(error: unknown): IssueDuRafraichissement {
    const status = httpStatusOf(error);
    if (status === 401) {
      this.clearSession();
      return 'refuse';
    }
    const { echecs } = this.fenetre.lire();
    if (status === 429) {
      const delayMs = throttledRetryDelayMs(error);
      this.reculer(delayMs, echecs);
      this.planRefresh(delayMs);
      return 'injoignable';
    }
    if (!isTransientFailure(status)) {
      return 'injoignable';
    }
    if (echecs >= RETRY_MAX_ATTEMPTS) {
      this.reculer(RECUL_EN_PANNE_MS, echecs);
      return 'injoignable';
    }
    const delayMs = Math.min(RETRY_INITIAL_DELAY_MS * 2 ** echecs, RETRY_MAX_DELAY_MS);
    this.reculer(delayMs, echecs + 1);
    this.planRefresh(delayMs);
    return 'injoignable';
  }

  private reculer(delaiMs: number, echecs: number): void {
    this.fenetre.ecrire({ pasAvant: Date.now() + delaiMs, echecs });
  }

  private adoptToken(token: string, expiresAt: number | null): void {
    this._token.set(token);
    this.accessTokenExpiresAt = expiresAt;
    this.fenetre.ecrire(FENETRE_OUVERTE);
    this.scheduleRefresh(expiresAt);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private clearState(): void {
    this.generationDeSession += 1;
    this.clearRefreshTimer();
    this.fenetre.ecrire(FENETRE_OUVERTE);
    this._isRestoreFailed.set(false);
    this._isSessionChecked.set(true);
    this._token.set(null);
    this._user.set(null);
    this.accessTokenExpiresAt = null;
  }
}
