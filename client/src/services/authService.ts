import type {
  AuthCredentials,
  AuthResponse,
  AuthUser,
  RegisterPayload,
  RequestRegisterOtpPayload,
  RequestRegisterOtpResponse,
} from '../types/auth';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000';

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      message?: string | string[];
    };

    if (Array.isArray(payload.message)) {
      return payload.message.join(', ');
    }

    if (typeof payload.message === 'string') {
      return payload.message;
    }
  } catch {
    // No-op: fallback below when response body is not JSON.
  }

  return 'Request failed. Please try again.';
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
    throw new Error(await parseError(response));
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
    throw new Error(await parseError(response));
  }

  return (await response.json()) as RequestRegisterOtpResponse;
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
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
    throw new Error(await parseError(response));
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
    throw new Error(await parseError(response));
  }
}
