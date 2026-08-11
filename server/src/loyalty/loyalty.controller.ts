import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma';

class AdjustPointsDto {
  points: number;
  description?: string;
}

@Controller('admin/loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('customers')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN, Role.VENDOR)
  async listCustomers(@Query('search') search?: string) {
    return this.loyaltyService.listCustomers(search);
  }

  @Patch('customers/:userId/adjust-points')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN, Role.VENDOR)
  @HttpCode(HttpStatus.OK)
  async adjustPoints(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: AdjustPointsDto,
  ) {
    return this.loyaltyService.adjustPoints(
      userId,
      dto.points,
      dto.description,
      {
        id: user.userId,
        email: user.email,
      },
    );
  }
}
