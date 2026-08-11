import useSWR from 'swr';
import { getAllOrders } from '../services/orderService';

export function useAdminOrders() {
  const { data, isLoading, error, mutate } = useSWR('admin:orders', getAllOrders);
  return { orders: data ?? [], isLoading, error, mutate };
}
