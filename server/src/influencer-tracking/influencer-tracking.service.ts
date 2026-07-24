import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateInfluencerTrackingDto } from './dto/create-influencer-tracking.dto';
import { ListInfluencerTrackingDto } from './dto/list-influencer-tracking.dto';

export interface InfluencerTrackingItemResponse {
  id: string;
  influencerName: string;
  influencerHandle?: string;
  code: string;
  trackingUrl: string;
  destinationPath: string;
  notes?: string;
  status: 'active' | 'disabled';
  clicks: number;
  accountsCreated: number;
  orders: number;
  revenue: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface InfluencerTrackingStatsResponse {
  totalClicks: number;
  totalAccounts: number;
  totalOrders: number;
  totalRevenue: number;
  activeLinks: number;
}

@Injectable()
export class InfluencerTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async listTrackingLinks(
    query: ListInfluencerTrackingDto,
  ): Promise<InfluencerTrackingItemResponse[]> {
    const normalizedSearch = query.search?.trim();

    const links = await this.prisma.influencerTrackingLink.findMany({
      where: {
        status: query.status?.toUpperCase() as 'ACTIVE' | 'DISABLED' | undefined,
        ...(normalizedSearch
          ? {
              OR: [
                {
                  influencerName: {
                    contains: normalizedSearch,
                  },
                },
                {
                  influencerHandle: {
                    contains: normalizedSearch,
                  },
                },
                {
                  code: {
                    contains: normalizedSearch,
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: {
            attributedUsers: true,
          },
        },
        attributedOrders: {
          select: {
            id: true,
            total: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const items = links.map((link) => this.mapTrackingLink(link));

    items.sort((left, right) =>
      this.compareItems(left, right, query.sortBy, query.sortOrder),
    );

    return items;
  }

  async getTrackingStats(): Promise<InfluencerTrackingStatsResponse> {
    const [links, activeLinks] = await Promise.all([
      this.prisma.influencerTrackingLink.findMany({
        include: {
          _count: {
            select: {
              attributedUsers: true,
            },
          },
          attributedOrders: {
            select: {
              total: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.influencerTrackingLink.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    return links.reduce<InfluencerTrackingStatsResponse>(
      (accumulator, link) => {
        const validOrders = link.attributedOrders.filter(
          (order) => order.status !== 'CANCELLED',
        );
        const revenue = validOrders.reduce(
          (sum, order) => sum + order.total,
          0,
        );

        accumulator.totalClicks += link.clicks;
        accumulator.totalAccounts += link._count.attributedUsers;
        accumulator.totalOrders += validOrders.length;
        accumulator.totalRevenue += revenue;
        accumulator.activeLinks = activeLinks;
        return accumulator;
      },
      {
        totalClicks: 0,
        totalAccounts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        activeLinks,
      },
    );
  }

  async createTrackingLink(
    dto: CreateInfluencerTrackingDto,
    actor: { id: string; email?: string },
  ): Promise<InfluencerTrackingItemResponse> {
    const code = await this.generateUniqueCode(
      dto.influencerHandle || dto.influencerName,
    );
    const destinationPath = this.normalizeDestinationPath(dto.destinationPath);

    const created = await this.prisma.influencerTrackingLink.create({
      data: {
        influencerName: dto.influencerName.trim(),
        influencerHandle: dto.influencerHandle?.trim() || null,
        code,
        destinationPath,
        notes: dto.notes?.trim() || null,
        createdById: actor.id,
      },
      include: {
        _count: {
          select: {
            attributedUsers: true,
          },
        },
        attributedOrders: {
          select: {
            id: true,
            total: true,
            status: true,
          },
        },
      },
    });

    await this.activityLogService.log({
      actorId: actor.id,
      actorName: actor.email,
      entityType: 'InfluencerTracking',
      entityId: created.id,
      action: 'CREATE',
      description: `Created influencer tracking link "${created.code}" for ${created.influencerName}`,
    });

    return this.mapTrackingLink(created);
  }

  async updateTrackingLink(
    id: string,
    dto: { status?: 'active' | 'disabled' },
    actor: { id: string; email?: string },
  ): Promise<InfluencerTrackingItemResponse> {
    const existing = await this.prisma.influencerTrackingLink.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Tracking link not found');
    }

    const updated = await this.prisma.influencerTrackingLink.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status.toUpperCase() as 'ACTIVE' | 'DISABLED' }),
      },
      include: {
        _count: {
          select: { attributedUsers: true },
        },
        attributedOrders: {
          select: { id: true, total: true, status: true },
        },
      },
    });

    await this.activityLogService.log({
      actorId: actor.id,
      actorName: actor.email,
      entityType: 'InfluencerTracking',
      entityId: id,
      action: 'UPDATE',
      description: `${dto.status === 'disabled' ? 'Disabled' : 'Enabled'} tracking link "${updated.code}" for ${updated.influencerName}`,
    });

    return this.mapTrackingLink(updated);
  }

  async trackVisitByCode(code: string): Promise<{ tracked: boolean }> {
    const normalizedCode = code.trim().toLowerCase();

    if (!normalizedCode) {
      return { tracked: false };
    }

    const link = await this.prisma.influencerTrackingLink.findFirst({
      where: {
        code: normalizedCode,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (!link) {
      return { tracked: false };
    }

    await this.prisma.influencerTrackingLink.update({
      where: { id: link.id },
      data: {
        clicks: {
          increment: 1,
        },
        lastClickedAt: new Date(),
      },
    });

    return { tracked: true };
  }

  private mapTrackingLink(link: {
    id: string;
    influencerName: string;
    influencerHandle: string | null;
    code: string;
    destinationPath: string;
    notes: string | null;
    status: 'ACTIVE' | 'DISABLED';
    clicks: number;
    createdAt: Date;
    updatedAt: Date;
    _count: { attributedUsers: number };
    attributedOrders: Array<{ total: number; status: string }>;
  }): InfluencerTrackingItemResponse {
    const validOrders = link.attributedOrders.filter(
      (order) => order.status !== 'CANCELLED',
    );
    const revenue = validOrders.reduce((sum, order) => sum + order.total, 0);
    const orders = validOrders.length;
    const conversionRate = link.clicks > 0 ? (orders / link.clicks) * 100 : 0;

    return {
      id: link.id,
      influencerName: link.influencerName,
      influencerHandle: link.influencerHandle ?? undefined,
      code: link.code,
      trackingUrl: this.buildTrackingUrl(link.code, link.destinationPath),
      destinationPath: link.destinationPath,
      notes: link.notes ?? undefined,
      status: link.status.toLowerCase() as 'active' | 'disabled',
      clicks: link.clicks,
      accountsCreated: link._count.attributedUsers,
      orders,
      revenue,
      conversionRate,
      createdAt: link.createdAt.toISOString(),
      updatedAt: link.updatedAt.toISOString(),
    };
  }

  private compareItems(
    left: InfluencerTrackingItemResponse,
    right: InfluencerTrackingItemResponse,
    sortBy: ListInfluencerTrackingDto['sortBy'],
    sortOrder: ListInfluencerTrackingDto['sortOrder'],
  ) {
    const direction = sortOrder === 'asc' ? 1 : -1;

    switch (sortBy) {
      case 'influencerName':
        return (
          left.influencerName.localeCompare(right.influencerName) * direction
        );
      case 'clicks':
        return (left.clicks - right.clicks) * direction;
      case 'accountsCreated':
        return (left.accountsCreated - right.accountsCreated) * direction;
      case 'orders':
        return (left.orders - right.orders) * direction;
      case 'revenue':
        return (left.revenue - right.revenue) * direction;
      case 'conversionRate':
        return (left.conversionRate - right.conversionRate) * direction;
      case 'createdAt':
      default:
        return (
          (new Date(left.createdAt).getTime() -
            new Date(right.createdAt).getTime()) *
          direction
        );
    }
  }

  private buildTrackingUrl(code: string, destinationPath: string): string {
    const baseOrigin =
      this.configService.get<string>('CLIENT_ORIGIN')?.split(',')[0]?.trim() ||
      'http://localhost:5173';
    const normalizedOrigin = baseOrigin.replace(/\/+$/, '');
    const normalizedPath = this.normalizeDestinationPath(destinationPath);
    const separator = normalizedPath.includes('?') ? '&' : '?';

    return `${normalizedOrigin}${normalizedPath}${separator}ref=${encodeURIComponent(code)}`;
  }

  private normalizeDestinationPath(destinationPath?: string): string {
    const trimmedPath = destinationPath?.trim();

    if (!trimmedPath) {
      return '/';
    }

    if (/^https?:\/\//i.test(trimmedPath)) {
      try {
        const parsed = new URL(trimmedPath);
        return `${parsed.pathname}${parsed.search}`;
      } catch {
        return '/';
      }
    }

    return trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
  }

  private async generateUniqueCode(seed: string): Promise<string> {
    const baseCode = this.slugify(seed) || 'influencer';
    let candidate = baseCode;
    let suffix = 2;

    while (true) {
      const existing = await this.prisma.influencerTrackingLink.findUnique({
        where: { code: candidate },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }

      candidate = `${baseCode}-${suffix}`;
      suffix += 1;
    }
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }
}
