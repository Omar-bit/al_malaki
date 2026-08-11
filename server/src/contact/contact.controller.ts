import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { IsEnum } from 'class-validator';
import { MessageStatus, Role } from '../generated/prisma';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import type { Request } from 'express';

class UpdateMessageStatusDto {
  @IsEnum(MessageStatus)
  status: MessageStatus;
}

@Controller('contact-messages')
@UseGuards(JwtAuthGuard)
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly prismaService: PrismaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createContactMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateContactMessageDto,
  ) {
    return this.contactService.createContactMessage(user.userId, dto);
  }

  @Get('my')
  getUserContactMessages(@CurrentUser() user: AuthenticatedUser) {
    return this.contactService.getUserContactMessages(user.userId);
  }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  @Roles(Role.ADMIN, Role.VENDOR)
  getAllContactMessages() {
    return this.contactService.getAllContactMessages();
  }

  @Sse('admin/stream')
  @UseGuards(AdminGuard)
  @Roles(Role.ADMIN, Role.VENDOR)
  streamAdmin(@Req() request: Request) {
    return this.contactService.createAdminStream(request);
  }

  @Sse('stream')
  streamUser(@CurrentUser() user: AuthenticatedUser, @Req() request: Request) {
    return this.contactService.createUserStream(user.userId, request);
  }

  @Get(':id')
  async getContactMessageById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const dbUser = await this.prismaService.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });
    if (!dbUser) {
      throw new ForbiddenException('User not found');
    }
    return this.contactService.getContactMessageById(id, {
      id: user.userId,
      role: dbUser.role,
    });
  }

  @Post(':id/replies')
  @HttpCode(HttpStatus.CREATED)
  async createReply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateReplyDto,
  ) {
    const dbUser = await this.prismaService.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });
    if (!dbUser) {
      throw new ForbiddenException('User not found');
    }
    return this.contactService.createReply(
      id,
      { id: user.userId, role: dbUser.role, email: user.email },
      dto.body,
    );
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  @Roles(Role.ADMIN, Role.VENDOR)
  updateContactMessageStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMessageStatusDto,
  ) {
    return this.contactService.updateContactMessageStatus(id, dto.status, {
      id: user.userId,
      email: user.email,
    });
  }
}
