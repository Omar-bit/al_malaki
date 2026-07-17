import {
  Injectable,
  Logger,
  MessageEvent,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { merge, Observable, of, Subject } from 'rxjs';
import {
  Notification,
  NotificationType,
  Prisma,
  Role,
} from '../generated/prisma';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListNotificationsDto } from './dto/list-notifications.dto';

type NotificationStreamPayload =
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

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
}

interface CreateNotificationsForRolesInput {
  roles: Role[];
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
  excludeUserIds?: string[];
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly streams = new Map<string, Set<Subject<MessageEvent>>>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async listForUser(userId: string, filters: ListNotificationsDto) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(filters.status === 'read'
        ? { isRead: true }
        : filters.status === 'unread'
          ? { isRead: false }
          : {}),
      ...(filters.type ? { type: filters.type } : {}),
    };

    return this.prismaService.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prismaService.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const existingNotification = await this.prismaService.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!existingNotification) {
      throw new NotFoundException('Notification not found');
    }

    if (existingNotification.isRead) {
      return existingNotification;
    }

    const updatedNotification = await this.prismaService.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    await this.emitToUser(userId, {
      kind: 'notification.read',
      notificationId,
      unreadCount: await this.getUnreadCount(userId),
    });

    return updatedNotification;
  }

  async markAllAsRead(userId: string) {
    await this.prismaService.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    await this.emitToUser(userId, {
      kind: 'notification.read-all',
      unreadCount: 0,
    });

    return { success: true };
  }

  async createNotification(input: CreateNotificationInput) {
    const notification = await this.prismaService.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data ?? {},
      },
    });

    const user = await this.prismaService.user.findUnique({
      where: { id: input.userId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (user?.email) {
      await this.sendNotificationEmail({
        to: user.email,
        recipientName: `${user.firstName} ${user.lastName}`.trim() || undefined,
        title: input.title,
        message: input.message,
      });
    }

    await this.emitToUser(input.userId, {
      kind: 'notification.created',
      notification,
      unreadCount: await this.getUnreadCount(input.userId),
    });

    return notification;
  }

  async createNotificationsForRoles(input: CreateNotificationsForRolesInput) {
    const recipients = await this.prismaService.user.findMany({
      where: {
        role: { in: input.roles },
        ...(input.excludeUserIds?.length
          ? { id: { notIn: input.excludeUserIds } }
          : {}),
      },
      select: { id: true },
    });

    return Promise.all(
      recipients.map((recipient) =>
        this.createNotification({
          userId: recipient.id,
          type: input.type,
          title: input.title,
          message: input.message,
          data: input.data,
        }),
      ),
    );
  }

  createStream(userId: string, request: Request): Observable<MessageEvent> {
    const userStreams = this.streams.get(userId) ?? new Set<Subject<MessageEvent>>();
    const stream = new Subject<MessageEvent>();

    userStreams.add(stream);
    this.streams.set(userId, userStreams);

    request.on('close', () => {
      const activeStreams = this.streams.get(userId);
      if (!activeStreams) {
        return;
      }

      activeStreams.delete(stream);
      stream.complete();

      if (activeStreams.size === 0) {
        this.streams.delete(userId);
      }
    });

    return merge(
      of({
        data: {
          kind: 'connected',
          unreadCount: 0,
        } satisfies NotificationStreamPayload,
      }),
      stream.asObservable(),
    );
  }

  private async emitToUser(userId: string, payload: NotificationStreamPayload) {
    const userStreams = this.streams.get(userId);

    if (!userStreams || userStreams.size === 0) {
      return;
    }

    for (const stream of userStreams) {
      stream.next({ data: payload });
    }
  }

  private async sendNotificationEmail(input: {
    to: string;
    recipientName?: string;
    title: string;
    message: string;
    subject?: string;
  }) {
    try {
      await this.mailService.sendEmail({
        to: input.to,
        subject: input.subject ?? input.title,
        text: `${input.title}\n\n${input.message}`,
        html: `
          <div style="margin:0;padding:24px;background:#f6efe3;font-family:Georgia,'Times New Roman',serif;color:#3f060f;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #ead8bf;">
              <tr>
                <td style="padding:28px 28px 16px;background:linear-gradient(120deg,#f8ecd8,#e8d4b5);text-align:center;">
                  <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#7d5645;">AL MALAKI</p>
                  <h1 style="margin:10px 0 0;font-size:26px;line-height:1.3;color:#3f060f;">${input.title}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 28px 8px;">
                  <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#5a3b33;">
                    ${input.recipientName ? `Hello ${input.recipientName},` : 'Hello,'}
                  </p>
                  <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#5a3b33;">${input.message}</p>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#7a5b4f;">You can also view and manage this notification directly inside your account.</p>
                </td>
              </tr>
            </table>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Unable to send notification email to ${input.to}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
