import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
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
  UpdateProfilePayload,
} from "../models/auth.model";
import type { AuthPort } from "../ports/auth.port";
import { getApiBaseUrl } from "../http/api-config";

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
    return this.http.post<AuthUser>(`${this.baseUrl}/auth/register`, payload);
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/auth/me`);
  }

  /** Envoie le jeton Google au backend pour authentification OAuth. */
  googleAuth(idToken: string): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.baseUrl}/auth/google`, {
      idToken,
    });
  }

  requestPasswordReset(
    payload: ForgotPasswordPayload,
  ): Observable<AuthActionMessage> {
    return this.http.post<AuthActionMessage>(
      `${this.baseUrl}/auth/forgot-password`,
      payload,
    );
  }

  resetPassword(payload: ResetPasswordPayload): Observable<AuthActionMessage> {
    return this.http.post<AuthActionMessage>(
      `${this.baseUrl}/auth/reset-password`,
      payload,
    );
  }

  setPassword(payload: SetPasswordPayload): Observable<AuthUser> {
    return this.http.post<AuthUser>(
      `${this.baseUrl}/auth/set-password`,
      payload,
    );
  }

  changePassword(payload: ChangePasswordPayload): Observable<AuthUser> {
    return this.http.patch<AuthUser>(
      `${this.baseUrl}/auth/change-password`,
      payload,
    );
  }

  /** Met a jour les informations du profil utilisateur. */
  updateProfile(payload: UpdateProfilePayload): Observable<AuthUser> {
    return this.http.patch<AuthUser>(`${this.baseUrl}/auth/profile`, payload);
  }
}
