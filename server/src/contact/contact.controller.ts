import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { IsEnum } from 'class-validator';
import { MessageStatus, Role } from '../generated/prisma';
import { Roles } from '../auth/decorators/roles.decorator';

class UpdateMessageStatusDto {
  @IsEnum(MessageStatus)
  status: MessageStatus;
}

@Controller('contact-messages')
@UseGuards(JwtAuthGuard)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

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

  @Get(':id')
  getContactMessageById(@Param('id') id: string) {
    return this.contactService.getContactMessageById(id);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  @Roles(Role.ADMIN, Role.VENDOR)
  updateContactMessageStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMessageStatusDto,
  ) {
    return this.contactService.updateContactMessageStatus(id, dto.status);
  }
}
