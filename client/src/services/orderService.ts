import { api } from './apiClient';
import type {
  CreateOrderPayload,
  LoyaltyInfo,
  Order,
  PromoValidationResult,
} from '../types/order';

export function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return api.post<Order>('/orders', payload);
}

export function getMyOrders(): Promise<Order[]> {
  return api.get<Order[]>('/orders/my');
}

export function getOrderById(orderId: string): Promise<Order> {
  return api.get<Order>(`/orders/${orderId}`);
}

export function getAllOrders(): Promise<Order[]> {
  return api.get<Order[]>('/orders/admin/all');
}

export function getMyLoyalty(): Promise<LoyaltyInfo> {
  return api.get<LoyaltyInfo>('/orders/my/loyalty');
}

export function validatePromoCode(
  code: string,
  subtotal: number,
): Promise<PromoValidationResult> {
  return api.get<PromoValidationResult>('/orders/validate-promo', {
    query: { code, subtotal },
  });
}

export function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<Order> {
  return api.patch<Order>(`/orders/${orderId}/status`, { status });
}
