import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { notificationService } from '../services';
import type { Notification, NotificationStreamEvent } from '../types/notification';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

function sortNotifications(items: Notification[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [allNotifications, nextUnreadCount] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadNotificationCount(),
      ]);

      setNotifications(sortNotifications(allNotifications));
      setUnreadCount(nextUnreadCount);
    } catch (error) {
      console.error('Unable to load notifications', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await notificationService.markNotificationAsRead(notificationId);
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              isRead: true,
              readAt: new Date().toISOString(),
            }
          : notification,
      ),
    );
    setUnreadCount((currentUnreadCount) => Math.max(0, currentUnreadCount - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllNotificationsAsRead();
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    void refreshNotifications();
  }, [isAuthLoading, refreshNotifications]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const stream = notificationService.createNotificationStream();

    stream.onmessage = (event) => {
      const payload = JSON.parse(event.data) as NotificationStreamEvent;

      if (payload.kind === 'notification.created') {
        setNotifications((currentNotifications) =>
          sortNotifications([
            payload.notification,
            ...currentNotifications.filter(
              (notification) => notification.id !== payload.notification.id,
            ),
          ]),
        );
        setUnreadCount(payload.unreadCount);
        toast(payload.notification.title, {
          duration: 4000,
        });
        return;
      }

      if (payload.kind === 'notification.read') {
        setNotifications((currentNotifications) =>
          currentNotifications.map((notification) =>
            notification.id === payload.notificationId
              ? {
                  ...notification,
                  isRead: true,
                  readAt: notification.readAt ?? new Date().toISOString(),
                }
              : notification,
          ),
        );
        setUnreadCount(payload.unreadCount);
        return;
      }

      if (payload.kind === 'notification.read-all') {
        setNotifications((currentNotifications) =>
          currentNotifications.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: notification.readAt ?? new Date().toISOString(),
          })),
        );
        setUnreadCount(payload.unreadCount);
      }
    };

    stream.onerror = () => {
      // The browser automatically retries EventSource connections.
    };

    return () => {
      stream.close();
    };
  }, [user]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  return context;
}
