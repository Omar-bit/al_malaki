import type {
  AuthCredentials,
  AuthResponse,
  AuthUser,
  ResetPasswordPayload,
  ResetPasswordResponse,
  RegisterPayload,
  RegisterResponse,
  RequestPasswordResetLinkPayload,
  RequestPasswordResetLinkResponse,
  RequestRegisterOtpPayload,
  RequestRegisterOtpResponse,
  ValidateResetPasswordTokenPayload,
  ValidateResetPasswordTokenResponse,
  VerifyRegisterOtpPayload,
  UpdateProfilePayload,
} from '../types/auth';
import { api } from './apiClient';

// Re-exported for backwards compatibility with existing `authService.ApiError`
// and `import { ApiError } from './authService'` call sites.
export { ApiError } from './apiClient';

export async function login(credentials: AuthCredentials): Promise<AuthUser> {
  const payload = await api.post<AuthResponse>('/auth/login', credentials);
  return payload.user;
}

export async function requestRegisterOtp(
  payload: RequestRegisterOtpPayload,
): Promise<RequestRegisterOtpResponse> {
  return api.post<RequestRegisterOtpResponse>(
    '/auth/register/request-otp',
    payload,
  );
}

export async function register(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  return api.post<RegisterResponse>('/auth/register', payload);
}

export async function uploadProfilePicture(
  file: File,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('image', file);
  return api.post<{ url: string }>(
    '/auth/register/upload-profile-picture',
    formData,
  );
}

export async function verifyRegisterOtp(
  payload: VerifyRegisterOtpPayload,
): Promise<AuthUser> {
  const responsePayload = await api.post<AuthResponse>(
    '/auth/register/verify-otp',
    payload,
  );
  return responsePayload.user;
}

export async function requestPasswordResetLink(
  payload: RequestPasswordResetLinkPayload,
): Promise<RequestPasswordResetLinkResponse> {
  return api.post<RequestPasswordResetLinkResponse>(
    '/auth/password/forgot',
    payload,
  );
}

export async function validateResetPasswordToken(
  payload: ValidateResetPasswordTokenPayload,
): Promise<ValidateResetPasswordTokenResponse> {
  return api.post<ValidateResetPasswordTokenResponse>(
    '/auth/password/validate-token',
    payload,
  );
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<ResetPasswordResponse> {
  return api.post<ResetPasswordResponse>('/auth/password/reset', payload);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const payload = await api.get<AuthResponse | null>('/auth/me', {
    allowStatuses: [401],
  });
  return payload?.user ?? null;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<AuthUser> {
  const result = await api.patch<AuthResponse>('/auth/me', payload);
  return result.user;
}

export async function logout(): Promise<void> {
  await api.post<void>('/auth/logout', undefined, { allowStatuses: [401] });
}
