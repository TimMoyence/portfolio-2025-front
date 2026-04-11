export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  roles: string[];
  hasPassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedOrCreatedBy?: string | null;
}

/**
 * Session d'authentification retournee par le backend.
 * Le refresh token n'est plus inclus dans le body JSON — il est emis
 * dans un cookie HttpOnly securise, gere automatiquement par le navigateur.
 */
export interface AuthSession {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface SetPasswordPayload {
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
}

export interface AuthActionMessage {
  message: string;
}

export interface ResendVerificationPayload {
  email: string;
}
