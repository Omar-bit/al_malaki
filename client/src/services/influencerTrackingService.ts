import type {
  CreateInfluencerTrackingPayload,
  InfluencerTrackingFilters,
  InfluencerTrackingItem,
  InfluencerTrackingStats,
} from '../types/influencer';
import { ApiError } from './authService';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000';

const STORAGE_KEY = 'al_malaki_influencer_tracking_code';
const SESSION_TRACKED_PREFIX = 'al_malaki_influencer_visit_';

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
    // no-op
  }

  return { message: 'Request failed. Please try again.' };
}

function canUseBrowserStorage() {
  return typeof window !== 'undefined';
}

export function storeInfluencerTrackingCode(code: string) {
  const normalizedCode = code.trim().toLowerCase();

  if (!canUseBrowserStorage() || !normalizedCode) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, normalizedCode);
}

export function getStoredInfluencerTrackingCode(): string | undefined {
  if (!canUseBrowserStorage()) {
    return undefined;
  }

  const code = window.localStorage.getItem(STORAGE_KEY)?.trim().toLowerCase();
  return code || undefined;
}

export async function trackInfluencerVisit(code: string): Promise<boolean> {
  const normalizedCode = code.trim().toLowerCase();

  if (!normalizedCode) {
    return false;
  }

  storeInfluencerTrackingCode(normalizedCode);

  if (
    canUseBrowserStorage() &&
    window.sessionStorage.getItem(`${SESSION_TRACKED_PREFIX}${normalizedCode}`)
  ) {
    return true;
  }

  const response = await fetch(`${API_BASE_URL}/influencer-tracking/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: normalizedCode }),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  const result = (await response.json()) as { tracked: boolean };

  if (result.tracked && canUseBrowserStorage()) {
    window.sessionStorage.setItem(
      `${SESSION_TRACKED_PREFIX}${normalizedCode}`,
      '1',
    );
  }

  return result.tracked;
}

export async function getInfluencerTrackingLinks(
  filters: InfluencerTrackingFilters = {},
): Promise<InfluencerTrackingItem[]> {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(
    `${API_BASE_URL}/admin/influencer-tracking${queryString}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as InfluencerTrackingItem[];
}

export async function getInfluencerTrackingStats(): Promise<InfluencerTrackingStats> {
  const response = await fetch(`${API_BASE_URL}/admin/influencer-tracking/stats`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as InfluencerTrackingStats;
}

export async function updateInfluencerTrackingLink(
  id: string,
  payload: { status?: 'active' | 'disabled' },
): Promise<InfluencerTrackingItem> {
  const response = await fetch(
    `${API_BASE_URL}/admin/influencer-tracking/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as InfluencerTrackingItem;
}

export async function createInfluencerTrackingLink(
  payload: CreateInfluencerTrackingPayload,
): Promise<InfluencerTrackingItem> {
  const response = await fetch(`${API_BASE_URL}/admin/influencer-tracking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as InfluencerTrackingItem;
}
