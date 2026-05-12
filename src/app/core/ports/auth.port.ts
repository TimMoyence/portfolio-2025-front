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
  ResendVerificationPayload,
  ResetPasswordPayload,
  SetPasswordPayload,
  UpdateProfilePayload,
} from "../models/auth.model";

export interface AuthPort {
  login(credentials: LoginCredentials): Observable<AuthSession>;
  /** Inscrit un nouvel utilisateur. Retourne un message (email de verification envoye). */
  register(payload: RegisterUserPayload): Observable<AuthActionMessage>;
  me(): Observable<AuthUser>;
  /**
   * Authentifie l'utilisateur via un jeton Google Identity Services.
   * `inviteToken` est optionnel : si present, le backend tentera d'accepter
   * l'invitation magic-link associee apres signature du JWT.
   */
  googleAuth(idToken: string, inviteToken?: string): Observable<AuthSession>;
  requestPasswordReset(
    payload: ForgotPasswordPayload,
  ): Observable<AuthActionMessage>;
  resetPassword(payload: ResetPasswordPayload): Observable<AuthActionMessage>;
  setPassword(payload: SetPasswordPayload): Observable<AuthUser>;
  changePassword(payload: ChangePasswordPayload): Observable<AuthUser>;
  /** Met a jour les informations du profil utilisateur (nom, prenom, telephone). */
  updateProfile(payload: UpdateProfilePayload): Observable<AuthUser>;
  /** Rafraichit le JWT via le cookie HttpOnly refresh_token. */
  refresh(): Observable<AuthSession>;
  /** Revoque le refresh token et efface le cookie (logout). */
  logout(): Observable<AuthActionMessage>;
  /** Verifie l'adresse email via le token recu par email. */
  verifyEmail(token: string): Observable<AuthActionMessage>;
  /** Renvoie l'email de verification. */
  resendVerification(
    payload: ResendVerificationPayload,
  ): Observable<AuthActionMessage>;
}

export const AUTH_PORT = new InjectionToken<AuthPort>("AUTH_PORT");
