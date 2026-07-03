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
  total: number;
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
  items: CreateOrderItemPayload[];
}
