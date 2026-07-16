import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prismaService: PrismaService) {}

  async createContactMessage(userId: string, dto: CreateContactMessageDto) {
    return this.prismaService.contactMessage.create({
      data: {
        userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        message: dto.message,
      },
    });
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

  async updateContactMessageStatus(id: string, status: 'UNREAD' | 'READ' | 'RESPONDED') {
    const message = await this.prismaService.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Contact message not found');
    }

    return this.prismaService.contactMessage.update({
      where: { id },
      data: { status },
    });
  }
}
