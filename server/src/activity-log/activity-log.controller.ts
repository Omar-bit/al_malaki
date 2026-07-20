import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { ListActivityLogsDto } from './dto/list-activity-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/activity-log')
@UseGuards(JwtAuthGuard, AdminGuard)
@Roles(Role.ADMIN)
export class ActivityLogController {
  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  async list(@Query() dto: ListActivityLogsDto) {
    return this.activityLogService.list(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const entry = await this.prismaService.activityLog.findUnique({
      where: { id },
    });
    if (!entry) {
      throw new NotFoundException('Activity log entry not found');
    }
    return entry;
  }
}
