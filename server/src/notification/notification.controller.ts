import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  listNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: ListNotificationsDto,
  ) {
    return this.notificationService.listForUser(user.userId, filters);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService
      .getUnreadCount(user.userId)
      .then((count) => ({
        unreadCount: count,
      }));
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.markAllAsRead(user.userId);
  }

  @Patch(':id/read')
  markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') notificationId: string,
  ) {
    return this.notificationService.markAsRead(user.userId, notificationId);
  }

  @Sse('stream')
  streamNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.notificationService.createStream(user.userId, request);
  }
}
