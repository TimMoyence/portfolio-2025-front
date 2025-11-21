import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterUserPayload,
} from '../models/auth.model';
import { AUTH_PORT } from '../ports/auth.port';
import type { AuthPort } from '../ports/auth.port';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    @Inject(AUTH_PORT) private readonly authPort: AuthPort,
  ) {}

  login(credentials: LoginCredentials): Observable<AuthSession> {
    return this.authPort.login(credentials);
  }

  register(payload: RegisterUserPayload): Observable<AuthUser> {
    return this.authPort.register(payload);
  }
}
