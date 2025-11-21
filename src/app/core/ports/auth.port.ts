import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterUserPayload,
} from '../models/auth.model';

export interface AuthPort {
  login(credentials: LoginCredentials): Observable<AuthSession>;
  register(payload: RegisterUserPayload): Observable<AuthUser>;
}

export const AUTH_PORT = new InjectionToken<AuthPort>('AUTH_PORT');
