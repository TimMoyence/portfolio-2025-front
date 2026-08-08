import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  AuthActionMessage,
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginCredentials,
  RegisterUserPayload,
  ResendVerificationPayload,
  ResetPasswordPayload,
  SetPasswordPayload,
  UpdateProfilePayload,
} from '../models/auth.model';

export interface AuthPort {
  login(credentials: LoginCredentials): Observable<AuthSession>;
  register(payload: RegisterUserPayload): Observable<AuthActionMessage>;
  me(): Observable<AuthUser>;
  googleAuth(idToken: string, inviteToken?: string): Observable<AuthSession>;
  requestPasswordReset(payload: ForgotPasswordPayload): Observable<AuthActionMessage>;
  resetPassword(payload: ResetPasswordPayload): Observable<AuthActionMessage>;
  setPassword(payload: SetPasswordPayload): Observable<AuthUser>;
  changePassword(payload: ChangePasswordPayload): Observable<AuthUser>;
  updateProfile(payload: UpdateProfilePayload): Observable<AuthUser>;
  refresh(): Observable<AuthSession>;
  logout(): Observable<AuthActionMessage>;
  verifyEmail(token: string): Observable<AuthActionMessage>;
  resendVerification(payload: ResendVerificationPayload): Observable<AuthActionMessage>;
}

export const AUTH_PORT = new InjectionToken<AuthPort>('AUTH_PORT');
