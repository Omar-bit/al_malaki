export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  usageLimit?: number;
  productId?: string;
  productName?: string;
  startDate: string;
  expiration?: string;
  isLifetime: boolean;
  source?: string;
  totalUsage: number;
  totalRevenue: number;
  status: 'active' | 'expired' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

export interface PromoCodeStats {
  totalRevenue: number;
  totalRedemptions: number;
  activeCodes: number;
}

export interface CreatePromoCodePayload {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  usageLimit?: number;
  productId?: string;
  startDate: string;
  expiration?: string;
  isLifetime: boolean;
  source?: string;
}

export interface UpdatePromoCodePayload {
  code?: string;
  discountType?: 'percentage' | 'fixed';
  value?: number;
  usageLimit?: number;
  productId?: string;
  startDate?: string;
  expiration?: string;
  isLifetime?: boolean;
  source?: string;
  status?: 'active' | 'expired' | 'disabled';
}
