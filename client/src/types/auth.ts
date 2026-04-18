export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RequestRegisterOtpPayload {
  email: string;
}

export interface RequestRegisterOtpResponse {
  message: string;
  expiresInSeconds: number;
}

export interface RequestPasswordResetLinkPayload {
  email: string;
}

export interface RequestPasswordResetLinkResponse {
  message: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  expiresInSeconds: number;
}

export interface VerifyRegisterOtpPayload {
  email: string;
  otpCode: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ValidateResetPasswordTokenPayload {
  token: string;
}

export interface ValidateResetPasswordTokenResponse {
  message: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  verifiedEmail: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
}
