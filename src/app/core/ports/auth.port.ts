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
}

export const AUTH_PORT = new InjectionToken<AuthPort>("AUTH_PORT");
