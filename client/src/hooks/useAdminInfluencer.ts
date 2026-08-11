import useSWR from 'swr';
import { getInfluencerTrackingLinks } from '../services/influencerTrackingService';
import type { InfluencerTrackingFilters } from '../types/influencer';

export function useAdminInfluencer(params: InfluencerTrackingFilters) {
  const key = ['admin:influencer', params.search ?? '', params.status ?? 'all', params.sortBy ?? 'createdAt', params.sortOrder ?? 'desc'] as const;

  const { data, isLoading, error, mutate } = useSWR(key, ([, search, status, sortBy, sortOrder]) =>
    getInfluencerTrackingLinks({
      search: search || undefined,
      status: status === 'all' ? undefined : (status as 'active' | 'disabled'),
      sortBy: sortBy as InfluencerTrackingFilters['sortBy'],
      sortOrder: sortOrder as 'asc' | 'desc',
    }),
  );

  return { items: data ?? [], isLoading, error, mutate };
}
