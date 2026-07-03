import { ApiError } from './authService';
import type { CreateOrderPayload, Order } from '../types/order';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000';

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

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return response.json() as Promise<Order>;
}

export async function getMyOrders(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/orders/my`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return response.json() as Promise<Order[]>;
}

export async function getOrderById(orderId: string): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return response.json() as Promise<Order>;
}
