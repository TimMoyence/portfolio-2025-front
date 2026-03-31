import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";
import type {
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterUserPayload,
} from "../models/auth.model";

export interface AuthPort {
  login(credentials: LoginCredentials): Observable<AuthSession>;
  register(payload: RegisterUserPayload): Observable<AuthUser>;
  me(): Observable<AuthUser>;
  /** Authentifie l'utilisateur via un jeton Google Identity Services. */
  googleAuth(idToken: string): Observable<AuthSession>;
}

export const AUTH_PORT = new InjectionToken<AuthPort>("AUTH_PORT");
