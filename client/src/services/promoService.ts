import type {
  PromoCode,
  PromoCodeStats,
  CreatePromoCodePayload,
  UpdatePromoCodePayload,
} from '../types/promo';
import { api } from './apiClient';

export function getPromoCodes(): Promise<PromoCode[]> {
  return api.get<PromoCode[]>('/admin/promo-codes');
}

export function getPromoStats(): Promise<PromoCodeStats> {
  return api.get<PromoCodeStats>('/admin/promo-codes/stats');
}

export function createPromoCode(
  payload: CreatePromoCodePayload,
): Promise<PromoCode> {
  return api.post<PromoCode>('/admin/promo-codes', payload);
}

export function updatePromoCode(
  id: string,
  payload: UpdatePromoCodePayload,
): Promise<PromoCode> {
  return api.patch<PromoCode>(`/admin/promo-codes/${id}`, payload);
}

export function deletePromoCode(id: string): Promise<void> {
  return api.delete(`/admin/promo-codes/${id}`);
}

export function togglePromoStatus(id: string): Promise<PromoCode> {
  return api.patch<PromoCode>(`/admin/promo-codes/${id}/toggle`);
}
