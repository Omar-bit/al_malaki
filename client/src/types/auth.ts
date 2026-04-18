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

export interface RegisterPayload {
  firstName: string;
  lastName: string;
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

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  verifiedEmail: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
}
