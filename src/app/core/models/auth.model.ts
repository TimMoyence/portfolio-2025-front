import type {
  AuthMessageResponseDto,
  AuthResponseDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  InscriptionDto,
  LoginDto,
  ResendVerificationDto,
  ResetPasswordDto,
  SetPasswordDto,
  UpdateProfileDto,
  UserResponseDto,
} from '../../../../contrat/types.gen';

export type AuthUser = UserResponseDto;
export type AuthSession = AuthResponseDto;
export type AuthActionMessage = AuthMessageResponseDto;
export type LoginCredentials = LoginDto;
export type RegisterUserPayload = InscriptionDto;
export type ForgotPasswordPayload = ForgotPasswordDto;
export type ResetPasswordPayload = ResetPasswordDto;
export type SetPasswordPayload = SetPasswordDto;
export type ChangePasswordPayload = ChangePasswordDto;
export type UpdateProfilePayload = UpdateProfileDto;
export type ResendVerificationPayload = ResendVerificationDto;
