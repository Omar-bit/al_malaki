import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationService } from '../notification/notification.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateAdminInvitationDto } from './dto/create-admin-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import {
  SendNotificationToRolesDto,
  SendNotificationToUsersDto,
} from './dto/send-notification.dto';
import { Role } from '../generated/prisma';

export interface AdminTeamMemberResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  verifiedEmail: boolean;
  createdAt: Date;
}

export interface CreateInvitationResponse {
  message: string;
  expiresAt: Date;
}

export type AdminInvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

export interface AdminInvitationResponse {
  id: string;
  email: string;
  role: Role;
  status: AdminInvitationStatus;
  invitedByName: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}

export interface AcceptInvitationResponse {
  message: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async listTeamMembers(): Promise<AdminTeamMemberResponse[]> {
    return this.prismaService.user.findMany({
      where: {
        role: {
          in: [Role.ADMIN, Role.VENDOR],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        verifiedEmail: true,
        createdAt: true,
      },
    });
  }

  async createInvitation(
    inviterId: string,
    dto: CreateAdminInvitationDto,
  ): Promise<CreateInvitationResponse> {
    const normalizedEmail = this.normalizeEmail(dto.email);

    if (dto.role === Role.CUSTOMER) {
      throw new BadRequestException(
        'Only admin or vendor invitations are allowed',
      );
    }

    const existingUser = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const inviter = await this.prismaService.user.findUnique({
      where: { id: inviterId },
      select: { firstName: true, lastName: true },
    });

    const inviterName = inviter
      ? `${inviter.firstName} ${inviter.lastName}`.trim()
      : 'AL MALAKI';

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + this.getInviteTtlMs());

    await this.prismaService.userInvitation.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        role: dto.role,
        tokenHash,
        invitedById: inviterId,
        expiresAt,
      },
      update: {
        role: dto.role,
        tokenHash,
        invitedById: inviterId,
        expiresAt,
        acceptedAt: null,
      },
    });

    const inviteUrl = this.buildInviteUrl(token, normalizedEmail);
    const expiresInHours = Math.max(
      1,
      Math.round(this.getInviteTtlMs() / (60 * 60 * 1000)),
    );

    await this.mailService.sendAdminInvitationEmail({
      to: normalizedEmail,
      inviteUrl,
      invitedByName: inviterName,
      roleLabel: this.getRoleLabel(dto.role),
      expiresInHours,
    });

    this.logger.log(`Admin invitation sent to ${normalizedEmail}`);

    await this.activityLogService.log({
      actorId: inviterId,
      actorName: inviterName,
      entityType: 'UserInvitation',
      entityId: normalizedEmail,
      action: 'CREATE',
      description: `Sent ${dto.role} invitation to ${normalizedEmail}`,
    });

    return {
      message: 'Invitation sent successfully',
      expiresAt,
    };
  }

  async listInvitations(): Promise<AdminInvitationResponse[]> {
    const invitations = await this.prismaService.userInvitation.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return invitations.map((invitation) => {
      const invitedByName =
        `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`.trim();

      return {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: this.getInvitationStatus(invitation),
        invitedByName,
        expiresAt: invitation.expiresAt,
        acceptedAt: invitation.acceptedAt,
        createdAt: invitation.createdAt,
      };
    });
  }

  async getVendorDashboardStats(): Promise<{
    ordersToday: number;
    topClients: number;
    newMessages: number;
    activePromos: number;
    pendingOrders: number;
    activeInfluencerCampaigns: number;
  }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      ordersToday,
      recentCustomerGroups,
      activePromos,
      newMessages,
      pendingOrders,
      activeInfluencerCampaigns,
    ] = await Promise.all([
      this.prismaService.order.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      this.prismaService.order.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prismaService.promoCode.count({
        where: { status: 'ACTIVE' },
      }),
      this.prismaService.contactMessage.count({
        where: { status: 'UNREAD' },
      }),
      this.prismaService.order.count({
        where: { status: 'PENDING' },
      }),
      this.prismaService.influencerTrackingLink.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    return {
      ordersToday,
      topClients: recentCustomerGroups.length,
      newMessages,
      activePromos,
      pendingOrders,
      activeInfluencerCampaigns,
    };
  }

  async getAdminDashboardStats(period?: string, dateStr?: string) {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(baseDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    // Normalize base date to local timezone without time component
    const normalizedBaseDate = new Date(baseDate);
    normalizedBaseDate.setHours(0, 0, 0, 0);

    const p = (period || 'month').toLowerCase();

    let currentStart: Date;
    let currentEnd: Date;
    let previousStart: Date;
    let previousEnd: Date;

    let chartPointsCount = 0;
    let intervalMs = 0;
    let getIntervalLabel: (d: Date) => string;

    if (p === 'day') {
      // Day period: from 00:00 to 23:59 of the selected date
      currentStart = new Date(normalizedBaseDate);
      currentEnd = new Date(normalizedBaseDate);
      currentEnd.setHours(23, 59, 59, 999);

      // Previous period: same day of previous week
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);
      previousEnd = new Date(previousStart);
      previousEnd.setHours(23, 59, 59, 999);

      chartPointsCount = 12;
      intervalMs = 2 * 60 * 60 * 1000;
      getIntervalLabel = (d: Date) => {
        const h = d.getHours();
        return `${String(h).padStart(2, '0')}:00`;
      };
    } else if (p === 'week') {
      // Week period: from Sunday 00:00 to Saturday 23:59 of the selected date's week
      currentStart = new Date(normalizedBaseDate);
      const dayOfWeek = currentStart.getDay();
      currentStart.setDate(currentStart.getDate() - dayOfWeek);
      currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + 6);
      currentEnd.setHours(23, 59, 59, 999);

      // Previous period: previous week
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);
      previousEnd = new Date(previousStart);
      previousEnd.setDate(previousEnd.getDate() + 6);
      previousEnd.setHours(23, 59, 59, 999);

      chartPointsCount = 7;
      intervalMs = 24 * 60 * 60 * 1000;
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      getIntervalLabel = (d: Date) => days[d.getDay()];
    } else if (p === 'year') {
      // Year period: from January 1st to December 31st of the selected date's year
      currentStart = new Date(normalizedBaseDate);
      currentStart.setMonth(0, 1);
      currentEnd = new Date(currentStart);
      currentEnd.setMonth(11, 31);
      currentEnd.setHours(23, 59, 59, 999);

      // Previous period: previous year
      previousStart = new Date(currentStart);
      previousStart.setFullYear(previousStart.getFullYear() - 1);
      previousEnd = new Date(previousStart);
      previousEnd.setMonth(11, 31);
      previousEnd.setHours(23, 59, 59, 999);

      chartPointsCount = 12;
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      getIntervalLabel = (d: Date) => months[d.getMonth()];
    } else {
      // Month period: from 1st day of month to last day of month
      currentStart = new Date(normalizedBaseDate);
      currentStart.setDate(1);
      currentEnd = new Date(currentStart);
      currentEnd.setMonth(currentEnd.getMonth() + 1, 0);
      currentEnd.setHours(23, 59, 59, 999);

      // Previous period: previous month
      previousStart = new Date(currentStart);
      previousStart.setMonth(previousStart.getMonth() - 1, 1);
      previousEnd = new Date(previousStart);
      previousEnd.setMonth(previousEnd.getMonth() + 1, 0);
      previousEnd.setHours(23, 59, 59, 999);

      chartPointsCount = 10;
      intervalMs = 3 * 24 * 60 * 60 * 1000;
      getIntervalLabel = (d: Date) => {
        return `${d.getMonth() + 1}/${d.getDate()}`;
      };
    }

    const [
      currentOrders,
      previousOrders,
      currentCustomersCount,
      previousCustomersCount,
      newCustomersInCurrent,
      totalProducts,
    ] = await Promise.all([
      this.prismaService.order.findMany({
        where: {
          createdAt: { gte: currentStart, lte: currentEnd },
          status: { not: 'CANCELLED' },
        },
        include: { items: true },
      }),
      this.prismaService.order.findMany({
        where: {
          createdAt: { gte: previousStart, lte: previousEnd },
          status: { not: 'CANCELLED' },
        },
      }),
      this.prismaService.user.count({
        where: {
          role: Role.CUSTOMER,
          createdAt: { lte: currentEnd },
        },
      }),
      this.prismaService.user.count({
        where: {
          role: Role.CUSTOMER,
          createdAt: { lte: previousEnd },
        },
      }),
      this.prismaService.user.findMany({
        where: {
          role: Role.CUSTOMER,
          createdAt: { gte: currentStart, lte: currentEnd },
        },
        select: { createdAt: true },
      }),
      this.prismaService.product.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    const currentRevenue = currentOrders.reduce((sum, o) => sum + o.total, 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + o.total, 0);
    const revenueTrend =
      previousRevenue === 0
        ? 0
        : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

    const currentOrdersCount = currentOrders.length;
    const previousOrdersCount = previousOrders.length;
    const ordersTrend =
      previousOrdersCount === 0
        ? 0
        : ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) *
          100;

    const currentUsersTrend =
      previousCustomersCount === 0
        ? 0
        : ((currentCustomersCount - previousCustomersCount) /
            previousCustomersCount) *
          100;

    // points proportional to revenue
    const currentPoints = Math.round(currentRevenue * 0.384);
    const previousPoints = Math.round(previousRevenue * 0.384);
    const pointsTrend =
      previousPoints === 0
        ? 0
        : ((currentPoints - previousPoints) / previousPoints) * 100;

    const chartData: {
      label: string;
      revenue: number;
      orders: number;
      users: number;
    }[] = [];

    for (let i = 0; i < chartPointsCount; i++) {
      let intervalStart: Date;
      let intervalEnd: Date;

      if (p === 'day') {
        intervalStart = new Date(currentStart.getTime() + i * intervalMs);
        intervalEnd = new Date(intervalStart.getTime() + intervalMs);
      } else if (p === 'week') {
        intervalStart = new Date(currentStart);
        intervalStart.setDate(intervalStart.getDate() + i);
        intervalEnd = new Date(intervalStart);
        intervalEnd.setHours(23, 59, 59, 999);
      } else if (p === 'year') {
        intervalStart = new Date(currentStart);
        intervalStart.setMonth(intervalStart.getMonth() + i);
        intervalEnd = new Date(intervalStart);
        intervalEnd.setMonth(intervalEnd.getMonth() + 1);
        intervalEnd.setDate(0);
        intervalEnd.setHours(23, 59, 59, 999);
      } else {
        // month
        intervalStart = new Date(currentStart.getTime() + i * intervalMs);
        intervalEnd = new Date(intervalStart.getTime() + intervalMs);
      }

      const intervalOrders = currentOrders.filter(
        (o) => o.createdAt >= intervalStart && o.createdAt < intervalEnd,
      );
      const intervalRevenue = intervalOrders.reduce(
        (sum, o) => sum + o.total,
        0,
      );
      const intervalOrdersCount = intervalOrders.length;

      const intervalNewUsers = newCustomersInCurrent.filter(
        (u) => u.createdAt >= intervalStart && u.createdAt < intervalEnd,
      ).length;

      chartData.push({
        label: getIntervalLabel(intervalStart),
        revenue: intervalRevenue,
        orders: intervalOrdersCount,
        users: intervalNewUsers,
      });
    }

    // Recent orders
    const recentOrdersRaw = await this.prismaService.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    });

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id,
      customer: `${o.firstName} ${o.lastName}`,
      total: o.total,
      status: o.status,
      date: o.createdAt,
    }));

    // Best selling product in current range
    const orderItems = currentOrders.flatMap((o) => o.items);
    const productSalesMap: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};
    for (const item of orderItems) {
      const key = item.productId || item.productName;
      if (!productSalesMap[key]) {
        productSalesMap[key] = {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productSalesMap[key].quantity += item.quantity;
      productSalesMap[key].revenue += item.price * item.quantity;
    }

    const bestSeller =
      Object.values(productSalesMap).sort(
        (a, b) => b.quantity - a.quantity,
      )[0] || null;

    return {
      revenue: {
        value: currentRevenue,
        formattedValue: `${currentRevenue.toLocaleString()} TND`,
        trend: parseFloat(revenueTrend.toFixed(1)),
        isPositive: revenueTrend >= 0,
      },
      orders: {
        value: currentOrdersCount,
        formattedValue: currentOrdersCount.toLocaleString(),
        trend: parseFloat(ordersTrend.toFixed(1)),
        isPositive: ordersTrend >= 0,
      },
      users: {
        value: currentCustomersCount,
        formattedValue: currentCustomersCount.toLocaleString(),
        trend: parseFloat(currentUsersTrend.toFixed(1)),
        isPositive: currentUsersTrend >= 0,
      },
      points: {
        value: currentPoints,
        formattedValue: `${currentPoints.toLocaleString()} PTS`,
        trend: parseFloat(pointsTrend.toFixed(1)),
        isPositive: pointsTrend >= 0,
      },
      chartData,
      bestSellingProduct: bestSeller,
      recentOrders,
      totalProducts,
    };
  }

  async deleteInvitation(
    invitationId: string,
    actor?: { id: string; email?: string },
  ): Promise<{ message: string }> {
    const invitation = await this.prismaService.userInvitation.findUnique({
      where: { id: invitationId },
      select: { id: true, email: true, role: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prismaService.userInvitation.delete({
      where: { id: invitationId },
    });

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        actorRole: undefined,
        entityType: 'UserInvitation',
        entityId: invitationId,
        action: 'DELETE',
        description: `Deleted ${invitation.role} invitation for ${invitation.email}`,
      });
    }

    return {
      message: 'Invitation deleted successfully',
    };
  }

  async acceptInvitation(
    dto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponse> {
    const tokenHash = this.hashToken(dto.token);

    const invitation = await this.prismaService.userInvitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation || invitation.acceptedAt) {
      throw new UnauthorizedException('Invalid or expired invitation');
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invitation has expired');
    }

    const normalizedEmail = this.normalizeEmail(invitation.email);
    const passwordHash = await hash(dto.password, 12);
    const phoneNumber = dto.phoneNumber?.trim() ?? null;

    await this.prismaService.$transaction(async (transaction) => {
      const existingUser = await transaction.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        await transaction.user.update({
          where: { id: existingUser.id },
          data: {
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            phoneNumber,
            passwordHash,
            role: invitation.role,
            verifiedEmail: true,
          },
        });
      } else {
        await transaction.user.create({
          data: {
            email: normalizedEmail,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            phoneNumber,
            passwordHash,
            role: invitation.role,
            verifiedEmail: true,
          },
        });
      }

      await transaction.userInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
    });

    return {
      message: 'Invitation accepted successfully',
    };
  }

  async sendNotificationToUsers(
    dto: SendNotificationToUsersDto,
    actor?: { id: string; email?: string },
  ) {
    const users = await this.prismaService.user.findMany({
      where: { id: { in: dto.userIds } },
      select: { id: true },
    });

    if (users.length === 0) {
      throw new BadRequestException('No users found for the given IDs');
    }

    const results = await Promise.all(
      users.map((user) =>
        this.notificationService.createNotification({
          userId: user.id,
          type: dto.type,
          title: dto.title,
          message: dto.message,
        }),
      ),
    );

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        actorRole: undefined,
        entityType: 'Notification',
        action: 'SEND_TO_USERS',
        description: `Sent notification "${dto.title}" to ${results.length} user(s)`,
        metadata: { type: dto.type, userIds: dto.userIds },
      });
    }

    return {
      message: `Notification sent to ${results.length} user(s)`,
      sentCount: results.length,
    };
  }

  async sendNotificationToRoles(
    dto: SendNotificationToRolesDto,
    actor?: { id: string; email?: string },
  ) {
    const results = await this.notificationService.createNotificationsForRoles({
      roles: dto.roles,
      type: dto.type,
      title: dto.title,
      message: dto.message,
    });

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        actorRole: undefined,
        entityType: 'Notification',
        action: 'SEND_TO_ROLES',
        description: `Sent notification "${dto.title}" to roles: ${dto.roles.join(', ')}`,
        metadata: { type: dto.type, roles: dto.roles },
      });
    }

    return {
      message: `Notification sent to ${results.length} user(s)`,
      sentCount: results.length,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getInviteTtlMs(): number {
    const rawValue = this.configService.get<string>('ADMIN_INVITE_TTL_HOURS');
    const parsedValue = Number(rawValue);

    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      return 48 * 60 * 60 * 1000;
    }

    return parsedValue * 60 * 60 * 1000;
  }

  private buildInviteUrl(token: string, email: string): string {
    const baseUrl = this.getInviteBaseUrl();
    const separator = baseUrl.includes('?') ? '&' : '?';

    return `${baseUrl}${separator}token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  }

  private getInviteBaseUrl(): string {
    const configured = this.configService
      .get<string>('ADMIN_INVITE_URL_BASE')
      ?.trim();

    if (configured) {
      return configured.replace(/\/+$/, '');
    }

    return `${this.getClientOrigin()}/invite/accept`;
  }

  private getClientOrigin(): string {
    const clientOrigin =
      this.configService.get<string>('CLIENT_ORIGIN') ??
      'http://localhost:5173';
    const firstOrigin =
      clientOrigin.split(',')[0]?.trim() || 'http://localhost:5173';

    return firstOrigin.replace(/\/+$/, '');
  }

  private getRoleLabel(role: Role): string {
    if (role === Role.ADMIN) {
      return 'Admin';
    }

    if (role === Role.VENDOR) {
      return 'Vendor';
    }

    return 'Team member';
  }

  private getInvitationStatus(invitation: {
    acceptedAt: Date | null;
    expiresAt: Date;
  }): AdminInvitationStatus {
    if (invitation.acceptedAt) {
      return 'ACCEPTED';
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      return 'EXPIRED';
    }

    return 'PENDING';
  }
}
