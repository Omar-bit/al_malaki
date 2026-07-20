import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { NotificationType, Role } from '../generated/prisma';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ContactService {
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

    return message;
  }

  async getUserContactMessages(userId: string) {
    return this.prismaService.contactMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllContactMessages() {
    return this.prismaService.contactMessage.findMany({
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContactMessageById(id: string) {
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

    return message;
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

    const customerName = `${message.user.firstName} ${message.user.lastName}`.trim();
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

    return updatedMessage;
  }
}
