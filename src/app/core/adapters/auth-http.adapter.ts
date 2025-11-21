import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterUserPayload,
} from '../models/auth.model';
import { AuthPort } from '../ports/auth.port';
import { getApiBaseUrl } from '../http/api-config';

@Injectable()
export class AuthHttpAdapter implements AuthPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginCredentials): Observable<AuthSession> {
    return this.http.post<AuthSession>(
      `${this.baseUrl}/auth/login`,
      credentials,
    );
  }

  register(payload: RegisterUserPayload): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.baseUrl}/users`, payload);
  }
}
