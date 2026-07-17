export type NotificationStatusFilter = 'all' | 'read' | 'unread';

export type NotificationType =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_CHANGED'
  | 'CONTACT_MESSAGE_CREATED'
  | 'CONTACT_MESSAGE_UPDATED'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListFilters {
  status?: NotificationStatusFilter;
  type?: NotificationType;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

export type NotificationStreamEvent =
  | {
      kind: 'connected';
      unreadCount: number;
    }
  | {
      kind: 'notification.created';
      notification: Notification;
      unreadCount: number;
    }
  | {
      kind: 'notification.read';
      notificationId: string;
      unreadCount: number;
    }
  | {
      kind: 'notification.read-all';
      unreadCount: number;
    };
