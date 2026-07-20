import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  PromoService,
  PromoCodeResponse,
  PromoStatsResponse,
} from './promo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma';

@Controller('admin/promo-codes')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  @Get()
  @Roles(Role.ADMIN, Role.VENDOR)
  async listPromoCodes(): Promise<PromoCodeResponse[]> {
    return this.promoService.listPromoCodes();
  }

  @Get('stats')
  async getStats(): Promise<PromoStatsResponse> {
    return this.promoService.getStats();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPromoCode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePromoDto,
  ): Promise<PromoCodeResponse> {
    return this.promoService.createPromoCode(dto, {
      id: user.userId,
      email: user.email,
    });
  }

  @Patch(':id')
  async updatePromoCode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePromoDto,
  ): Promise<PromoCodeResponse> {
    return this.promoService.updatePromoCode(id, dto, {
      id: user.userId,
      email: user.email,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePromoCode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.promoService.deletePromoCode(id, {
      id: user.userId,
      email: user.email,
    });
  }

  @Patch(':id/toggle')
  async toggleStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<PromoCodeResponse> {
    return this.promoService.toggleStatus(id, {
      id: user.userId,
      email: user.email,
    });
  }
}
