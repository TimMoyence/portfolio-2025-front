import { of } from 'rxjs';
import type {
  AuthSession,
  AuthUser,
  ForgotPasswordPayload,
  LoginCredentials,
  ResetPasswordPayload,
  SetPasswordPayload,
} from '../../app/core/models/auth.model';
import type { AuthPort } from '../../app/core/ports/auth.port';

export function buildAuthUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: null,
    isActive: true,
    roles: ['weather'],
    ...overrides,
  };
}

export function buildAuthSession(overrides?: Partial<AuthSession>): AuthSession {
  return {
    accessToken: 'jwt-token',
    expiresIn: 3600,
    user: buildAuthUser(),
    ...overrides,
  };
}

export function buildLoginCredentials(overrides?: Partial<LoginCredentials>): LoginCredentials {
  return {
    email: 'test@example.com',
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- fixture de test, pas un secret reel
    password: 'Password123!',
    ...overrides,
  };
}

export function buildForgotPasswordPayload(
  overrides?: Partial<ForgotPasswordPayload>,
): ForgotPasswordPayload {
  return {
    email: 'test@example.com',
    ...overrides,
  };
}

export function buildResetPasswordPayload(
  overrides?: Partial<ResetPasswordPayload>,
): ResetPasswordPayload {
  return {
    token: '0'.repeat(64),
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- fixture de test, pas un secret reel
    newPassword: 'NewPassword123!',
    ...overrides,
  };
}

export function buildSetPasswordPayload(
  overrides?: Partial<SetPasswordPayload>,
): SetPasswordPayload {
  return {
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- fixture de test, pas un secret reel
    newPassword: 'NewPassword123!',
    ...overrides,
  };
}

export function createAuthPortStub(): Record<keyof AuthPort, jasmine.Spy> {
  return {
    login: jasmine.createSpy('login').and.returnValue(of(null)),
    register: jasmine
      .createSpy('register')
      .and.returnValue(of({ message: 'Inscription reussie.' })),
    me: jasmine.createSpy('me').and.returnValue(of(null)),
    googleAuth: jasmine.createSpy('googleAuth').and.returnValue(of(null)),
    requestPasswordReset: jasmine
      .createSpy('requestPasswordReset')
      .and.returnValue(of({ message: 'ok' })),
    resetPassword: jasmine.createSpy('resetPassword').and.returnValue(of({ message: 'ok' })),
    setPassword: jasmine.createSpy('setPassword').and.returnValue(of(buildAuthUser())),
    changePassword: jasmine.createSpy('changePassword').and.returnValue(of(buildAuthUser())),
    updateProfile: jasmine.createSpy('updateProfile').and.returnValue(of(buildAuthUser())),
    refresh: jasmine.createSpy('refresh').and.returnValue(of(buildAuthSession())),
    logout: jasmine.createSpy('logout').and.returnValue(of({ message: 'ok' })),
    verifyEmail: jasmine
      .createSpy('verifyEmail')
      .and.returnValue(of({ message: 'Email verifie.' })),
    resendVerification: jasmine
      .createSpy('resendVerification')
      .and.returnValue(of({ message: 'ok' })),
  };
}
