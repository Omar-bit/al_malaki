import type {
  AuthCredentials,
  AuthResponse,
  AuthUser,
  RegisterPayload,
  RegisterResponse,
  RequestRegisterOtpPayload,
  RequestRegisterOtpResponse,
  VerifyRegisterOtpPayload,
} from '../types/auth';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000';

type ApiErrorPayload = {
  message?: string | string[];
  code?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function parseError(
  response: Response,
): Promise<{ message: string; code?: string }> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;

    const code =
      typeof payload.code === 'string' && payload.code.trim().length > 0
        ? payload.code.trim()
        : undefined;

    if (Array.isArray(payload.message)) {
      return {
        message: payload.message.join(', '),
        code,
      };
    }

    if (typeof payload.message === 'string') {
      return {
        message: payload.message,
        code,
      };
    }
  } catch {
    // No-op: fallback below when response body is not JSON.
  }

  return {
    message: 'Request failed. Please try again.',
  };
}

export async function login(credentials: AuthCredentials): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  const payload = (await response.json()) as AuthResponse;
  return payload.user;
}

export async function requestRegisterOtp(
  payload: RequestRegisterOtpPayload,
): Promise<RequestRegisterOtpResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register/request-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as RequestRegisterOtpResponse;
}

export async function register(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as RegisterResponse;
}

export async function verifyRegisterOtp(
  payload: VerifyRegisterOtpPayload,
): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/register/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  const responsePayload = (await response.json()) as AuthResponse;
  return responsePayload.user;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  const payload = (await response.json()) as AuthResponse;
  return payload.user;
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok && response.status !== 401) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }
}
