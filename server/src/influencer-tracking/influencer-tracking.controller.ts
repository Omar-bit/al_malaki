import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { Role } from '../generated/prisma';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { CreateInfluencerTrackingDto } from './dto/create-influencer-tracking.dto';
import { ListInfluencerTrackingDto } from './dto/list-influencer-tracking.dto';
import { TrackInfluencerVisitDto } from './dto/track-influencer-visit.dto';
import { UpdateInfluencerTrackingDto } from './dto/update-influencer-tracking.dto';
import {
  InfluencerTrackingItemResponse,
  InfluencerTrackingService,
  InfluencerTrackingStatsResponse,
} from './influencer-tracking.service';

@Controller()
export class InfluencerTrackingController {
  constructor(
    private readonly influencerTrackingService: InfluencerTrackingService,
  ) {}

  @Post('influencer-tracking/visit')
  @HttpCode(HttpStatus.OK)
  async trackVisit(@Body() dto: TrackInfluencerVisitDto) {
    return this.influencerTrackingService.trackVisitByCode(dto.code);
  }

  @Get('admin/influencer-tracking')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN, Role.VENDOR)
  async listTrackingLinks(
    @Query() query: ListInfluencerTrackingDto,
  ): Promise<InfluencerTrackingItemResponse[]> {
    return this.influencerTrackingService.listTrackingLinks(query);
  }

  @Get('admin/influencer-tracking/stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN, Role.VENDOR)
  async getStats(): Promise<InfluencerTrackingStatsResponse> {
    return this.influencerTrackingService.getTrackingStats();
  }

  @Post('admin/influencer-tracking')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createTrackingLink(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInfluencerTrackingDto,
  ): Promise<InfluencerTrackingItemResponse> {
    return this.influencerTrackingService.createTrackingLink(dto, {
      id: user.userId,
      email: user.email,
    });
  }

  @Patch('admin/influencer-tracking/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  async updateTrackingLink(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateInfluencerTrackingDto,
  ): Promise<InfluencerTrackingItemResponse> {
    return this.influencerTrackingService.updateTrackingLink(id, dto, {
      id: user.userId,
      email: user.email,
    });
  }
}
