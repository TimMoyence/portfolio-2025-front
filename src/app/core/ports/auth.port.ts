import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";
import type {
  AuthActionMessage,
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginCredentials,
  RegisterUserPayload,
  ResetPasswordPayload,
  SetPasswordPayload,
} from "../models/auth.model";

export interface AuthPort {
  login(credentials: LoginCredentials): Observable<AuthSession>;
  register(payload: RegisterUserPayload): Observable<AuthUser>;
  me(): Observable<AuthUser>;
  /** Authentifie l'utilisateur via un jeton Google Identity Services. */
  googleAuth(idToken: string): Observable<AuthSession>;
  requestPasswordReset(
    payload: ForgotPasswordPayload,
  ): Observable<AuthActionMessage>;
  resetPassword(payload: ResetPasswordPayload): Observable<AuthActionMessage>;
  setPassword(payload: SetPasswordPayload): Observable<AuthUser>;
  changePassword(payload: ChangePasswordPayload): Observable<AuthUser>;
}

export const AUTH_PORT = new InjectionToken<AuthPort>("AUTH_PORT");
