import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Prisma } from '../generated/prisma';
import { ListActivityLogsDto } from './dto/list-activity-logs.dto';

export interface LogActivityParams {
  actorId: string;
  actorName?: string;
  actorRole?: Role;
  entityType: string;
  entityId?: string;
  action: string;
  description?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityLogService {
  constructor(private readonly prismaService: PrismaService) {}

  async log(params: LogActivityParams): Promise<void> {
    await this.prismaService.activityLog.create({
      data: {
        actorId: params.actorId,
        actorName: params.actorName ?? null,
        actorRole: params.actorRole ?? null,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        action: params.action,
        description: params.description ?? null,
        changes: (params.changes ?? {}) as Prisma.InputJsonValue,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async list(filters: ListActivityLogsDto) {
    const where: Prisma.ActivityLogWhereInput = {};

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.actorId) {
      where.actorId = filters.actorId;
    }
    if (filters.actorRole) {
      where.actorRole = filters.actorRole as Role;
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }
    if (filters.search) {
      where.description = {
        contains: filters.search,
      };
    }

    const skip = (filters.page - 1) * filters.limit;

    const orderBy: Prisma.ActivityLogOrderByWithRelationInput = {};
    orderBy[filters.sortBy ?? 'createdAt'] = filters.sortOrder ?? 'desc';

    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.activityLog.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy,
      }),
      this.prismaService.activityLog.count({ where }),
    ]);

    return { data, total, page: filters.page, limit: filters.limit };
  }
}
