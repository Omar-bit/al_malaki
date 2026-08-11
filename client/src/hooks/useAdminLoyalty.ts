import useSWR from 'swr';
import { getLoyaltyCustomers } from '../services/adminService';

export function useAdminLoyalty(search?: string) {
  const { data, isLoading, error, mutate } = useSWR(
    ['admin:loyalty', search ?? ''],
    ([, s]: [string, string]) => getLoyaltyCustomers(s || undefined),
  );
  return { customers: data ?? [], isLoading, error, mutate };
}
