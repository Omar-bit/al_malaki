import type {
  PromoCode,
  PromoCodeStats,
  CreatePromoCodePayload,
  UpdatePromoCodePayload,
} from '../types/promo';
import { ApiError } from './authService';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000';

type ApiErrorPayload = {
  message?: string | string[];
  code?: string;
};

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
    // fallback when response body is not JSON
  }

  return { message: 'Request failed. Please try again.' };
}

export async function getPromoCodes(): Promise<PromoCode[]> {
  const response = await fetch(`${API_BASE_URL}/admin/promo-codes`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as PromoCode[];
}

export async function getPromoStats(): Promise<PromoCodeStats> {
  const response = await fetch(`${API_BASE_URL}/admin/promo-codes/stats`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as PromoCodeStats;
}

export async function createPromoCode(
  payload: CreatePromoCodePayload,
): Promise<PromoCode> {
  const response = await fetch(`${API_BASE_URL}/admin/promo-codes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as PromoCode;
}

export async function updatePromoCode(
  id: string,
  payload: UpdatePromoCodePayload,
): Promise<PromoCode> {
  const response = await fetch(`${API_BASE_URL}/admin/promo-codes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as PromoCode;
}

export async function deletePromoCode(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/promo-codes/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }
}

export async function togglePromoStatus(id: string): Promise<PromoCode> {
  const response = await fetch(
    `${API_BASE_URL}/admin/promo-codes/${id}/toggle`,
    {
      method: 'PATCH',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as PromoCode;
}
