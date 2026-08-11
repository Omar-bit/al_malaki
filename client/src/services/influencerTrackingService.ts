import type {
  CreateInfluencerTrackingPayload,
  InfluencerTrackingFilters,
  InfluencerTrackingItem,
  InfluencerTrackingStats,
} from '../types/influencer';
import { api } from './apiClient';

const STORAGE_KEY = 'al_malaki_influencer_tracking_code';
const SESSION_TRACKED_PREFIX = 'al_malaki_influencer_visit_';

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

  const result = await api.post<{ tracked: boolean }>(
    '/influencer-tracking/visit',
    { code: normalizedCode },
  );

  if (result.tracked && canUseBrowserStorage()) {
    window.sessionStorage.setItem(
      `${SESSION_TRACKED_PREFIX}${normalizedCode}`,
      '1',
    );
  }

  return result.tracked;
}

export function getInfluencerTrackingLinks(
  filters: InfluencerTrackingFilters = {},
): Promise<InfluencerTrackingItem[]> {
  return api.get<InfluencerTrackingItem[]>('/admin/influencer-tracking', {
    query: {
      search: filters.search,
      status: filters.status,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    },
  });
}

export function getInfluencerTrackingStats(): Promise<InfluencerTrackingStats> {
  return api.get<InfluencerTrackingStats>('/admin/influencer-tracking/stats');
}

export function updateInfluencerTrackingLink(
  id: string,
  payload: { status?: 'active' | 'disabled' },
): Promise<InfluencerTrackingItem> {
  return api.patch<InfluencerTrackingItem>(
    `/admin/influencer-tracking/${id}`,
    payload,
  );
}

export function createInfluencerTrackingLink(
  payload: CreateInfluencerTrackingPayload,
): Promise<InfluencerTrackingItem> {
  return api.post<InfluencerTrackingItem>(
    '/admin/influencer-tracking',
    payload,
  );
}
