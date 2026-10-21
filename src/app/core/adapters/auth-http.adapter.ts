import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  zAuthMessageResponseDto as messageServi,
  zAuthResponseDto as sessionServie,
  zUserResponseDto as utilisateurServi,
} from '../../../../contrat/zod.gen';
import type { AuthPort } from '../ports/auth.port';
import { getApiBaseUrl } from '../http/api-config';
import { luPar } from './lu-par';

@Injectable()
export class AuthHttpAdapter implements AuthPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  readonly login: AuthPort['login'] = (credentials) =>
    this.http
      .post<unknown>(`${this.baseUrl}/auth/login`, credentials, { withCredentials: true })
      .pipe(luPar(sessionServie));

  readonly register: AuthPort['register'] = (payload) =>
    this.http.post<unknown>(`${this.baseUrl}/auth/register`, payload).pipe(luPar(messageServi));

  readonly me: AuthPort['me'] = () =>
    this.http.get<unknown>(`${this.baseUrl}/auth/me`).pipe(luPar(utilisateurServi));

  readonly googleAuth: AuthPort['googleAuth'] = (idToken) =>
    this.http
      .post<unknown>(`${this.baseUrl}/auth/google`, { idToken }, { withCredentials: true })
      .pipe(luPar(sessionServie));

  readonly requestPasswordReset: AuthPort['requestPasswordReset'] = (payload) =>
    this.http
      .post<unknown>(`${this.baseUrl}/auth/forgot-password`, payload)
      .pipe(luPar(messageServi));

  readonly resetPassword: AuthPort['resetPassword'] = (payload) =>
    this.http
      .post<unknown>(`${this.baseUrl}/auth/reset-password`, payload)
      .pipe(luPar(messageServi));

  readonly setPassword: AuthPort['setPassword'] = (payload) =>
    this.http
      .post<unknown>(`${this.baseUrl}/auth/set-password`, payload)
      .pipe(luPar(utilisateurServi));

  readonly changePassword: AuthPort['changePassword'] = (payload) =>
    this.http
      .patch<unknown>(`${this.baseUrl}/auth/change-password`, payload)
      .pipe(luPar(utilisateurServi));

  readonly updateProfile: AuthPort['updateProfile'] = (payload) =>
    this.http.patch<unknown>(`${this.baseUrl}/auth/profile`, payload).pipe(luPar(utilisateurServi));

  readonly refresh: AuthPort['refresh'] = () =>
    this.http
      .post<unknown>(`${this.baseUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(luPar(sessionServie));

  readonly logout: AuthPort['logout'] = () =>
    this.http
      .post<unknown>(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(luPar(messageServi));

  readonly verifyEmail: AuthPort['verifyEmail'] = (token) =>
    this.http
      .get<unknown>(`${this.baseUrl}/auth/verify-email`, { params: { token } })
      .pipe(luPar(messageServi));

  readonly resendVerification: AuthPort['resendVerification'] = (payload) =>
    this.http
      .post<unknown>(`${this.baseUrl}/auth/resend-verification`, payload)
      .pipe(luPar(messageServi));
}
