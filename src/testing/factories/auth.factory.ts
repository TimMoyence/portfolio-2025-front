import { of } from "rxjs";
import type {
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginCredentials,
  ResetPasswordPayload,
  SetPasswordPayload,
} from "../../app/core/models/auth.model";
import type { AuthPort } from "../../app/core/ports/auth.port";

/**
 * Construit un objet AuthUser avec des valeurs par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildAuthUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: "user-1",
    email: "test@example.com",
    firstName: "Jean",
    lastName: "Dupont",
    phone: null,
    isActive: true,
    roles: ["weather"],
    ...overrides,
  };
}

/** Construit une session auth avec des valeurs par defaut. */
export function buildAuthSession(
  overrides?: Partial<AuthSession>,
): AuthSession {
  return {
    accessToken: "jwt-token",
    expiresIn: 3600,
    user: buildAuthUser(),
    ...overrides,
  };
}

/** Construit des credentials de login. */
export function buildLoginCredentials(
  overrides?: Partial<LoginCredentials>,
): LoginCredentials {
  return {
    email: "test@example.com",
    password: "Password123!",
    ...overrides,
  };
}

/** Construit un payload forgot-password. */
export function buildForgotPasswordPayload(
  overrides?: Partial<ForgotPasswordPayload>,
): ForgotPasswordPayload {
  return {
    email: "test@example.com",
    ...overrides,
  };
}

/** Construit un payload reset-password. */
export function buildResetPasswordPayload(
  overrides?: Partial<ResetPasswordPayload>,
): ResetPasswordPayload {
  return {
    token: "4f7ab9f3f7b3d0eaa77a4b5b0dcaea31695f15de22f22e53f35b98b0aaf3112c",
    newPassword: "NewPassword123!",
    ...overrides,
  };
}

/** Construit un payload set-password. */
export function buildSetPasswordPayload(
  overrides?: Partial<SetPasswordPayload>,
): SetPasswordPayload {
  return {
    newPassword: "NewPassword123!",
    ...overrides,
  };
}

/** Construit un payload change-password. */
export function buildChangePasswordPayload(
  overrides?: Partial<ChangePasswordPayload>,
): ChangePasswordPayload {
  return {
    currentPassword: "OldPassword123!",
    newPassword: "NewPassword456!",
    ...overrides,
  };
}

/**
 * Cree un stub complet du port auth avec des spies Jasmine.
 * Les spies retournent of(null) par defaut pour eviter les erreurs
 * de subscribe dans AuthStateService.restoreSession().
 */
export function createAuthPortStub(): Record<keyof AuthPort, jasmine.Spy> {
  return {
    login: jasmine.createSpy("login").and.returnValue(of(null)),
    register: jasmine.createSpy("register").and.returnValue(of(null)),
    me: jasmine.createSpy("me").and.returnValue(of(null)),
    googleAuth: jasmine.createSpy("googleAuth").and.returnValue(of(null)),
    requestPasswordReset: jasmine
      .createSpy("requestPasswordReset")
      .and.returnValue(of({ message: "ok" })),
    resetPassword: jasmine
      .createSpy("resetPassword")
      .and.returnValue(of({ message: "ok" })),
    setPassword: jasmine
      .createSpy("setPassword")
      .and.returnValue(of(buildAuthUser())),
    changePassword: jasmine
      .createSpy("changePassword")
      .and.returnValue(of(buildAuthUser())),
    updateProfile: jasmine
      .createSpy("updateProfile")
      .and.returnValue(of(buildAuthUser())),
  };
}
