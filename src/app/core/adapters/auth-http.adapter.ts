import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { AuthActionMessage, AuthSession, AuthUser } from '../models/auth.model';
import type { AuthPort } from '../ports/auth.port';
import { getApiBaseUrl } from '../http/api-config';

@Injectable()
export class AuthHttpAdapter implements AuthPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  readonly login: AuthPort['login'] = (credentials) =>
    this.http.post<AuthSession>(`${this.baseUrl}/auth/login`, credentials, {
      withCredentials: true,
    });

  readonly register: AuthPort['register'] = (payload) =>
    this.http.post<AuthActionMessage>(`${this.baseUrl}/auth/register`, payload);

  readonly me: AuthPort['me'] = () => this.http.get<AuthUser>(`${this.baseUrl}/auth/me`);

  readonly googleAuth: AuthPort['googleAuth'] = (idToken, inviteToken) => {
    const body: { idToken: string; inviteToken?: string } = { idToken };
    if (inviteToken) {
      body.inviteToken = inviteToken;
    }
    return this.http.post<AuthSession>(`${this.baseUrl}/auth/google`, body, {
      withCredentials: true,
    });
  };

  readonly requestPasswordReset: AuthPort['requestPasswordReset'] = (payload) =>
    this.http.post<AuthActionMessage>(`${this.baseUrl}/auth/forgot-password`, payload);

  readonly resetPassword: AuthPort['resetPassword'] = (payload) =>
    this.http.post<AuthActionMessage>(`${this.baseUrl}/auth/reset-password`, payload);

  readonly setPassword: AuthPort['setPassword'] = (payload) =>
    this.http.post<AuthUser>(`${this.baseUrl}/auth/set-password`, payload);

  readonly changePassword: AuthPort['changePassword'] = (payload) =>
    this.http.patch<AuthUser>(`${this.baseUrl}/auth/change-password`, payload);

  readonly updateProfile: AuthPort['updateProfile'] = (payload) =>
    this.http.patch<AuthUser>(`${this.baseUrl}/auth/profile`, payload);

  readonly refresh: AuthPort['refresh'] = () =>
    this.http.post<AuthSession>(`${this.baseUrl}/auth/refresh`, {}, { withCredentials: true });

  readonly logout: AuthPort['logout'] = () =>
    this.http.post<AuthActionMessage>(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true });

  readonly verifyEmail: AuthPort['verifyEmail'] = (token) =>
    this.http.get<AuthActionMessage>(`${this.baseUrl}/auth/verify-email`, {
      params: { token },
    });

  readonly resendVerification: AuthPort['resendVerification'] = (payload) =>
    this.http.post<AuthActionMessage>(`${this.baseUrl}/auth/resend-verification`, payload);
}
