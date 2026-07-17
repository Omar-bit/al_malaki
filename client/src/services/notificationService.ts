import { ApiError } from './authService';
import type {
  Notification,
  NotificationListFilters,
  NotificationUnreadCountResponse,
} from '../types/notification';

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

export async function getNotifications(
  filters: NotificationListFilters = {},
): Promise<Notification[]> {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }

  if (filters.type) {
    params.set('type', filters.type);
  }

  const response = await fetch(
    `${API_BASE_URL}/notifications${params.toString() ? `?${params.toString()}` : ''}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return response.json() as Promise<Notification[]>;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  const payload =
    (await response.json()) as NotificationUnreadCountResponse;

  return payload.unreadCount;
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<Notification> {
  const response = await fetch(
    `${API_BASE_URL}/notifications/${notificationId}/read`,
    {
      method: 'PATCH',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return response.json() as Promise<Notification>;
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return response.json() as Promise<{ success: boolean }>;
}

export function createNotificationStream() {
  return new EventSource(`${API_BASE_URL}/notifications/stream`, {
    withCredentials: true,
  });
}
