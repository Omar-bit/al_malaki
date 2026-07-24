import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, CheckCheck, ChevronDown, ChevronRight, Filter, RefreshCcw } from 'lucide-react';
import { AdminLayout, Header } from '../components';
import { useAuth, useNotifications } from '../contexts';
import type { Notification, NotificationStatusFilter, NotificationType } from '../types';

const notificationTypeLabels: Record<NotificationType, string> = {
  ORDER_CREATED: 'Order created',
  ORDER_STATUS_CHANGED: 'Order status changed',
  CONTACT_MESSAGE_CREATED: 'Contact message created',
  CONTACT_MESSAGE_UPDATED: 'Contact message updated',
  SYSTEM: 'System',
};

function formatNotificationDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

function NotificationsContent() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, refreshNotifications } =
    useNotifications();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] =
    useState<NotificationStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | NotificationType>('all');

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        const matchesStatus =
          statusFilter === 'all'
            ? true
            : statusFilter === 'read'
              ? notification.isRead
              : !notification.isRead;

        const matchesType =
          typeFilter === 'all' ? true : notification.type === typeFilter;

        return matchesStatus && matchesType;
      }),
    [notifications, statusFilter, typeFilter],
  );

  const groupedNotifications = useMemo(() => {
    const groups = new Map<string, Notification[]>();
    for (const n of filteredNotifications) {
      const key = `${n.type}::${n.title}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(n);
    }
    return Array.from(groups.entries()).sort(
      (a, b) =>
        new Date(b[1][0].createdAt).getTime() -
        new Date(a[1][0].createdAt).getTime(),
    );
  }, [filteredNotifications]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const groupUnreadCount = (items: Notification[]) =>
    items.filter((n) => !n.isRead).length;

  const markGroupAsRead = async (items: Notification[]) => {
    const unread = items.filter((n) => !n.isRead);
    for (const n of unread) {
      try {
        await markAsRead(n.id);
      } catch (error) {
        console.error('Unable to mark notification as read', error);
      }
    }
    if (unread.length > 0) toast.success('Marked as read.');
  };

  const navigateToNotification = (notification: Notification) => {
    const isAdmin =
      user?.role === 'ADMIN' || user?.role === 'VENDOR';
    const orderId = notification.data?.orderId as string | undefined;
    const contactMessageId = notification.data?.contactMessageId as string | undefined;

    if (orderId) {
      if (isAdmin) {
        navigate(`/admin/orders?highlight=${orderId}`);
      } else {
        navigate(`/dashboard?highlight=${orderId}`);
      }
      return;
    }

    if (contactMessageId) {
      if (isAdmin) {
        navigate(`/admin/messages?highlight=${contactMessageId}`);
      } else {
        navigate(`/dashboard`);
      }
      return;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Unable to mark notification as read', error);
      }
    }
    navigateToNotification(notification);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Unable to mark notification as read', error);
      toast.error('Unable to update the notification.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read.');
    } catch (error) {
      console.error('Unable to mark all notifications as read', error);
      toast.error('Unable to update notifications.');
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Unable to refresh notifications', error);
      toast.error('Unable to refresh notifications.');
    }
  };

  return (
    <div className='space-y-6'>
      <section className='rounded-[28px] border border-[#3F060F]/20 bg-[#fff9f1] p-6 shadow-sm'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div>
            <div className='mb-3 flex items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-[#3f060f] text-[#fdf8f0]'>
                <Bell className='h-5 w-5' />
              </div>
              <div>
                <h1 className='font-bona text-3xl font-bold text-[#3f060f]'>
                  Notifications
                </h1>
                <p className='font-bona text-sm text-[#6d5a46]'>
                  Track new orders, order updates, contact activity, and system alerts in one place.
                </p>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-3'>
              <div className='rounded-full bg-[#efe0c9] px-4 py-2 font-bona text-sm text-[#3f060f]'>
                Total: {notifications.length}
              </div>
              <div className='rounded-full bg-[#3f060f] px-4 py-2 font-bona text-sm text-[#fdf8f0]'>
                Unread: {unreadCount}
              </div>
            </div>
          </div>

          <div className='flex flex-wrap gap-3'>
            <button
              type='button'
              onClick={handleRefresh}
              className='inline-flex items-center gap-2 rounded-full border border-[#3F060F]/20 px-4 py-2 font-bona text-sm text-[#3f060f] transition hover:bg-[#efe0c9]'
            >
              <RefreshCcw className='h-4 w-4' />
              Refresh
            </button>
            <button
              type='button'
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className='inline-flex items-center gap-2 rounded-full bg-[#3f060f] px-4 py-2 font-bona text-sm text-[#fdf8f0] transition hover:bg-[#5a0b18] disabled:cursor-not-allowed disabled:opacity-60'
            >
              <CheckCheck className='h-4 w-4' />
              Mark all as read
            </button>
          </div>
        </div>
      </section>

      <section className='rounded-[28px] border border-[#3F060F]/20 bg-[#fff9f1] p-6 shadow-sm'>
        <div className='mb-4 flex items-center gap-2 font-bona text-sm font-semibold text-[#3f060f]'>
          <Filter className='h-4 w-4' />
          Filter notifications
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <label className='space-y-2'>
            <span className='font-bona text-sm text-[#6d5a46]'>Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as NotificationStatusFilter)
              }
              className='w-full rounded-2xl border border-[#d4bfa8] bg-[#fdf8f0] px-4 py-3 font-bona text-sm text-[#3f060f] outline-none focus:border-[#3f060f]'
            >
              <option value='all'>All notifications</option>
              <option value='unread'>Unread only</option>
              <option value='read'>Read only</option>
            </select>
          </label>

          <label className='space-y-2'>
            <span className='font-bona text-sm text-[#6d5a46]'>Type</span>
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as 'all' | NotificationType)
              }
              className='w-full rounded-2xl border border-[#d4bfa8] bg-[#fdf8f0] px-4 py-3 font-bona text-sm text-[#3f060f] outline-none focus:border-[#3f060f]'
            >
              <option value='all'>All types</option>
              {Object.entries(notificationTypeLabels).map(([type, label]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className='space-y-4'>
        {isLoading ? (
          <div className='flex min-h-[240px] items-center justify-center rounded-[28px] border border-[#3F060F]/20 bg-[#fff9f1]'>
            <div className='h-10 w-10 animate-spin rounded-full border-2 border-[#3f060f] border-t-transparent' />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className='rounded-[28px] border border-dashed border-[#3F060F]/20 bg-[#fff9f1] p-10 text-center'>
            <p className='font-bona text-xl font-bold text-[#3f060f]'>
              No notifications found
            </p>
            <p className='mt-2 font-bona text-sm text-[#6d5a46]'>
              Try changing the active filters or come back after new platform activity.
            </p>
          </div>
        ) : (
          groupedNotifications.map(([key, items]) => {
            const isExpanded = expandedGroups.has(key);
            const unread = groupUnreadCount(items);
            const typeLabel =
              notificationTypeLabels[items[0].type] || items[0].type;
            return (
              <div
                key={key}
                className={`rounded-[28px] border shadow-sm transition ${
                  unread > 0
                    ? 'border-[#3F060F]/25 bg-[#efe0c9]/40'
                    : 'border-[#3F060F]/10 bg-[#fff9f1]'
                }`}
              >
                <button
                  type='button'
                  onClick={() => toggleGroup(key)}
                  className='flex w-full items-center justify-between p-5 text-left'
                >
                  <div className='flex items-center gap-3'>
                    {isExpanded ? (
                      <ChevronDown className='h-5 w-5 text-[#3f060f]' />
                    ) : (
                      <ChevronRight className='h-5 w-5 text-[#3f060f]' />
                    )}
                    <div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='rounded-full bg-[#fdf8f0] px-3 py-1 font-bona text-xs text-[#6d5a46]'>
                          {typeLabel}
                        </span>
                        {unread > 0 && (
                          <span className='rounded-full bg-[#3f060f] px-3 py-1 font-bona text-xs font-semibold text-[#fdf8f0]'>
                            {unread} unread
                          </span>
                        )}
                      </div>
                      <h2 className='mt-2 font-bona text-xl font-bold text-[#3f060f]'>
                        {items[0].title}
                      </h2>
                      <p className='mt-1 font-bona text-sm text-[#6d5a46]'>
                        {items.length} notification{items.length > 1 ? 's' : ''}{' '}
                        &middot; Latest{' '}
                        {formatNotificationDate(items[0].createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-2' onClick={(e) => e.stopPropagation()}>
                    {unread > 0 && (
                      <button
                        type='button'
                        onClick={() => markGroupAsRead(items)}
                        className='rounded-full border border-[#3F060F]/20 px-3 py-1.5 font-bona text-xs text-[#3f060f] transition hover:bg-[#fdf2e2]'
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className='border-t border-[#3F060F]/10 px-5 pb-5'>
                    {items.map((notification) => (
                      <button
                        key={notification.id}
                        type='button'
                        onClick={() => handleNotificationClick(notification)}
                        className={`flex w-full items-start justify-between gap-4 py-4 text-left transition hover:bg-[#3f060f]/5 ${
                          notification.isRead ? '' : ''
                        }`}
                      >
                        <div className='space-y-1'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <span
                              className={`rounded-full px-2 py-0.5 font-bona text-[10px] font-semibold uppercase tracking-[0.12em] ${
                                notification.isRead
                                  ? 'bg-[#efe0c9] text-[#6d5a46]'
                                  : 'bg-[#3f060f] text-[#fdf8f0]'
                              }`}
                            >
                              {notification.isRead ? 'Read' : 'Unread'}
                            </span>
                            <span className='font-bona text-xs text-[#6d5a46]'>
                              {formatNotificationDate(notification.createdAt)}
                            </span>
                          </div>
                          <p className='font-bona text-sm leading-6 text-[#4c372d]'>
                            {notification.message}
                          </p>
                        </div>

                        {!notification.isRead && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className='shrink-0 rounded-full border border-[#3F060F]/20 px-3 py-1 font-bona text-xs text-[#3f060f] transition hover:bg-[#fdf2e2]'
                          >
                            Mark read
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

export function NotificationsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#fdf8f0]'>
        <div className='h-10 w-10 animate-spin rounded-full border-2 border-[#3f060f] border-t-transparent' />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role === 'ADMIN' || user.role === 'VENDOR') {
    return (
      <AdminLayout>
        <div className='px-4 py-5 md:px-8'>
          <NotificationsContent />
        </div>
      </AdminLayout>
    );
  }

  return (
    <div className='min-h-screen bg-[#fdf8f0]'>
      <Header withBackground={false} />
      <main className='mx-auto max-w-5xl px-4 py-28'>
        <NotificationsContent />
      </main>
    </div>
  );
}
