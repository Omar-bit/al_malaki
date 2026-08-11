export const API_BASE_URL =
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
      return { message: payload.message.join(', '), code };
    }
    if (typeof payload.message === 'string') {
      return { message: payload.message, code };
    }
  } catch {
    // Response body was not JSON — fall through to the generic message.
  }

  return { message: 'Request failed. Please try again.' };
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** JSON-serialised automatically, unless it is a FormData instance. */
  body?: unknown;
  /** Appended as a query string (undefined values are skipped). */
  query?: Record<string, string | number | boolean | undefined>;
  /** Status codes that resolve to `null` instead of throwing (e.g. 401 on /auth/me). */
  allowStatuses?: number[];
}

function buildUrl(
  path: string,
  query?: RequestOptions['query'],
): string {
  let url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.append(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += `${url.includes('?') ? '&' : '?'}${qs}`;
  }
  return url;
}

/**
 * Single entry point for every backend call. Handles base URL, credentials,
 * JSON vs FormData bodies, query strings, empty/204 responses, and consistent
 * `ApiError` throwing so individual services stay declarative.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, query, allowStatuses, headers, ...rest } = options;

  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;

  const finalHeaders = new Headers(headers);
  let finalBody: BodyInit | undefined;

  if (body !== undefined) {
    if (isFormData) {
      finalBody = body as FormData; // browser sets multipart Content-Type
    } else {
      finalBody = JSON.stringify(body);
      if (!finalHeaders.has('Content-Type')) {
        finalHeaders.set('Content-Type', 'application/json');
      }
    }
  }

  const response = await fetch(buildUrl(path, query), {
    credentials: 'include',
    ...rest,
    headers: finalHeaders,
    body: finalBody,
  });

  if (allowStatuses?.includes(response.status)) {
    return null as T;
  }

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  delete: <T = void>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
