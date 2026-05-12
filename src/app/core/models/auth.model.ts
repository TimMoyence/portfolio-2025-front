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
  /**
   * Token clair d'invitation magic-link (issu du query param `?invite=`).
   * Si fourni, le backend tentera de l'accepter apres creation du user et
   * pourra retourner un `inviteWarning` en cas d'echec metier.
   */
  inviteToken?: string;
}

/**
 * Detail d'echec d'acceptation d'invitation (rapporte en plus du succes
 * d'inscription) — voir CreateUsersUseCase.tryAcceptInvitation cote backend.
 */
export interface InviteWarning {
  /** Code identifiant la cause (INVITATION_NOT_FOUND, INVITATION_EXPIRED, ...). */
  code: string;
  /** Message lisible pour l'utilisateur. */
  message: string;
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
  /**
   * Renseigne uniquement quand l'utilisateur a fourni un `inviteToken` lors de
   * l'inscription et que son acceptation a echoue cote backend (ex: token
   * expire, email mismatch). Le compte est cree malgre tout.
   */
  inviteWarning?: InviteWarning;
}

export interface ResendVerificationPayload {
  email: string;
}
