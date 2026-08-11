export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'CARD';

export interface OrderItem {
  id: string;
  productId: string | null;
  productName: string;
  productSlug: string;
  image: string | null;
  price: number;
  quantity: number;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  secondPhone: string | null;
  address: string;
  city: string;
  postalCode: string;
  subtotal: number;
  discount: number;
  packDiscount: number;
  pointsUsed: number;
  total: number;
  giftMessage: string | null;
  promoCodeId: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemPayload {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  paymentMethod: PaymentMethod;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  secondPhone?: string;
  address: string;
  city: string;
  postalCode: string;
  influencerTrackingCode?: string;
  promoCode?: string;
  pointsToUse?: number;
  packDiscount?: number;
  giftMessage?: string;
  items: CreateOrderItemPayload[];
}

export interface LoyaltyInfo {
  points: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
}

export interface PromoValidationResult {
  code: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  value: number;
  productId: string | null;
  discountAmount: number;
}
