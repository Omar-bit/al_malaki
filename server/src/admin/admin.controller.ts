import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('team')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listTeamMembers() {
    return this.adminService.listTeamMembers();
  }

  @Get('vendor/dashboard-stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN, Role.VENDOR)
  async getVendorDashboardStats() {
    return this.adminService.getVendorDashboardStats();
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

  @Get('invitations')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listInvitations() {
    return this.adminService.listInvitations();
  }

  @Delete('invitations/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async deleteInvitation(@Param('id') id: string) {
    return this.adminService.deleteInvitation(id);
  }
}
