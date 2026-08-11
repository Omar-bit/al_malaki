import { api, API_BASE_URL } from './apiClient';
import type {
  Notification,
  NotificationListFilters,
  NotificationUnreadCountResponse,
} from '../types/notification';

export function getNotifications(
  filters: NotificationListFilters = {},
): Promise<Notification[]> {
  return api.get<Notification[]>('/notifications', {
    query: {
      status:
        filters.status && filters.status !== 'all' ? filters.status : undefined,
      type: filters.type,
    },
  });
}

export async function getUnreadNotificationCount(): Promise<number> {
  const payload = await api.get<NotificationUnreadCountResponse>(
    '/notifications/unread-count',
  );
  return payload.unreadCount;
}

export function markNotificationAsRead(
  notificationId: string,
): Promise<Notification> {
  return api.patch<Notification>(`/notifications/${notificationId}/read`);
}

export function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  return api.patch<{ success: boolean }>('/notifications/read-all');
}

export function createNotificationStream(): EventSource {
  return new EventSource(`${API_BASE_URL}/notifications/stream`, {
    withCredentials: true,
  });
}
