import {
  ForbiddenException,
  Injectable,
  MessageEvent,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { merge, Observable, of, Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import {
  ContactMessage,
  ContactMessageReply,
  NotificationType,
  Role,
} from '../generated/prisma';
import { NotificationService } from '../notification/notification.service';

type ContactStreamPayload =
  | { kind: 'connected' }
  | {
      kind: 'message.created';
      message: ContactMessage & { replies: ContactMessageReply[] };
    }
  | {
      kind: 'reply.created';
      contactMessageId: string;
      customerId: string;
      reply: ContactMessageReply;
    }
  | {
      kind: 'message.status.updated';
      contactMessageId: string;
      customerId: string;
      status: 'UNREAD' | 'READ' | 'RESPONDED';
    };

const messageWithReplies = {
  replies: { orderBy: { createdAt: 'asc' as const } },
} as const;

@Injectable()
export class ContactService {
  private readonly adminStreams = new Set<Subject<MessageEvent>>();
  private readonly userStreams = new Map<string, Set<Subject<MessageEvent>>>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async createContactMessage(userId: string, dto: CreateContactMessageDto) {
    const message = await this.prismaService.contactMessage.create({
      data: {
        userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        message: dto.message,
      },
      include: messageWithReplies,
    });

    const customerName = `${dto.firstName} ${dto.lastName}`.trim();
    const shortMessageId = message.id.slice(-6).toUpperCase();

    await Promise.all([
      this.notificationService.createNotification({
        userId,
        type: NotificationType.CONTACT_MESSAGE_CREATED,
        title: 'Message sent successfully',
        message: `Your support message #${shortMessageId} was sent successfully. Our team will get back to you soon.`,
        data: {
          contactMessageId: message.id,
          status: message.status,
        },
      }),
      this.notificationService.createNotificationsForRoles({
        roles: [Role.ADMIN, Role.VENDOR],
        type: NotificationType.CONTACT_MESSAGE_CREATED,
        title: 'New contact message',
        message: `${customerName} sent a new contact message (#${shortMessageId}).`,
        data: {
          contactMessageId: message.id,
          customerId: userId,
          status: message.status,
        },
      }),
    ]);

    this.broadcast(
      { kind: 'message.created', message },
      { customerId: userId },
    );

    return message;
  }

  async getUserContactMessages(userId: string) {
    return this.prismaService.contactMessage.findMany({
      where: { userId },
      include: messageWithReplies,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllContactMessages() {
    return this.prismaService.contactMessage.findMany({
      include: {
        ...messageWithReplies,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContactMessageById(
    id: string,
    requester: { id: string; role: Role },
  ) {
    const message = await this.prismaService.contactMessage.findUnique({
      where: { id },
      include: {
        ...messageWithReplies,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Contact message not found');
    }

    // Only staff or the owner of the conversation may read it.
    const isStaff =
      requester.role === Role.ADMIN || requester.role === Role.VENDOR;
    if (!isStaff && message.userId !== requester.id) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    return message;
  }

  async createReply(
    contactMessageId: string,
    author: { id: string; role: Role; email?: string },
    body: string,
  ) {
    const message = await this.prismaService.contactMessage.findUnique({
      where: { id: contactMessageId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Contact message not found');
    }

    const isStaff = author.role === Role.ADMIN || author.role === Role.VENDOR;
    if (!isStaff && author.id !== message.userId) {
      throw new ForbiddenException('You cannot reply to this conversation');
    }

    const reply = await this.prismaService.contactMessageReply.create({
      data: {
        contactMessageId,
        authorId: author.id,
        authorRole: author.role,
        body,
      },
    });

    const shortMessageId = message.id.slice(-6).toUpperCase();

    // When staff replies, mark the message as RESPONDED and notify the customer.
    // When the customer replies, bump the message back to UNREAD and notify staff.
    if (isStaff) {
      if (message.status !== 'RESPONDED') {
        await this.prismaService.contactMessage.update({
          where: { id: contactMessageId },
          data: { status: 'RESPONDED' },
        });
        this.broadcast(
          {
            kind: 'message.status.updated',
            contactMessageId,
            customerId: message.userId,
            status: 'RESPONDED',
          },
          { customerId: message.userId },
        );
      }

      await this.notificationService.createNotification({
        userId: message.userId,
        type: NotificationType.CONTACT_MESSAGE_UPDATED,
        title: 'New reply from support',
        message: `Support replied to your message #${shortMessageId}.`,
        data: {
          contactMessageId,
          replyId: reply.id,
        },
      });

      await this.activityLogService.log({
        actorId: author.id,
        actorName: author.email,
        actorRole: author.role,
        entityType: 'ContactMessage',
        entityId: contactMessageId,
        action: 'REPLY',
        description: `Replied to message #${shortMessageId}`,
      });
    } else {
      if (message.status !== 'UNREAD') {
        await this.prismaService.contactMessage.update({
          where: { id: contactMessageId },
          data: { status: 'UNREAD' },
        });
        this.broadcast(
          {
            kind: 'message.status.updated',
            contactMessageId,
            customerId: message.userId,
            status: 'UNREAD',
          },
          { customerId: message.userId },
        );
      }

      const customerName =
        `${message.user.firstName} ${message.user.lastName}`.trim();
      await this.notificationService.createNotificationsForRoles({
        roles: [Role.ADMIN, Role.VENDOR],
        type: NotificationType.CONTACT_MESSAGE_UPDATED,
        title: 'Customer replied',
        message: `${customerName} replied to message #${shortMessageId}.`,
        data: {
          contactMessageId,
          replyId: reply.id,
          customerId: message.userId,
        },
      });
    }

    this.broadcast(
      {
        kind: 'reply.created',
        contactMessageId,
        customerId: message.userId,
        reply,
      },
      { customerId: message.userId },
    );

    return reply;
  }

  async updateContactMessageStatus(
    id: string,
    status: 'UNREAD' | 'READ' | 'RESPONDED',
    actor?: { id: string; email?: string },
  ) {
    const message = await this.prismaService.contactMessage.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Contact message not found');
    }

    const oldStatus = message.status;

    const updatedMessage = await this.prismaService.contactMessage.update({
      where: { id },
      data: { status },
    });

    const shortMessageId = message.id.slice(-6).toUpperCase();

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        actorRole: undefined,
        entityType: 'ContactMessage',
        entityId: id,
        action: 'STATUS_CHANGE',
        description: `Changed message #${shortMessageId} status from ${oldStatus} to ${status}`,
        changes: {
          status: { old: oldStatus, new: status },
        },
      });
    }

    await this.notificationService.createNotification({
      userId: message.userId,
      type: NotificationType.CONTACT_MESSAGE_UPDATED,
      title: 'Contact message updated',
      message: `Your support message #${shortMessageId} is now marked as ${status.toLowerCase()}.`,
      data: {
        contactMessageId: updatedMessage.id,
        status: updatedMessage.status,
      },
    });

    this.broadcast(
      {
        kind: 'message.status.updated',
        contactMessageId: id,
        customerId: message.userId,
        status,
      },
      { customerId: message.userId },
    );

    return updatedMessage;
  }

  /* ─────────────────────── SSE ─────────────────────── */

  createAdminStream(request: Request): Observable<MessageEvent> {
    const stream = new Subject<MessageEvent>();
    this.adminStreams.add(stream);
    request.on('close', () => {
      this.adminStreams.delete(stream);
      stream.complete();
    });
    return merge(
      of({ data: { kind: 'connected' } satisfies ContactStreamPayload }),
      stream.asObservable(),
    );
  }

  createUserStream(userId: string, request: Request): Observable<MessageEvent> {
    const streams =
      this.userStreams.get(userId) ?? new Set<Subject<MessageEvent>>();
    const stream = new Subject<MessageEvent>();
    streams.add(stream);
    this.userStreams.set(userId, streams);

    request.on('close', () => {
      const active = this.userStreams.get(userId);
      if (!active) return;
      active.delete(stream);
      stream.complete();
      if (active.size === 0) this.userStreams.delete(userId);
    });

    return merge(
      of({ data: { kind: 'connected' } satisfies ContactStreamPayload }),
      stream.asObservable(),
    );
  }

  private broadcast(
    payload: ContactStreamPayload,
    target: { customerId?: string },
  ) {
    for (const stream of this.adminStreams) {
      stream.next({ data: payload });
    }
    if (target.customerId) {
      const userStreams = this.userStreams.get(target.customerId);
      if (userStreams) {
        for (const stream of userStreams) {
          stream.next({ data: payload });
        }
      }
    }
  }
}
