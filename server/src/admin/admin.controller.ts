import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { CreateAdminInvitationDto } from './dto/create-admin-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('team')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listTeamMembers() {
    return this.adminService.listTeamMembers();
  }

  @Post('invitations')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAdminInvitationDto,
  ) {
    return this.adminService.createInvitation(user.userId, dto);
  }

  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.adminService.acceptInvitation(dto);
  }
}
