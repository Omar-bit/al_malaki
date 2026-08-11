import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { Role } from '../generated/prisma';

export interface CustomerLoyaltyResponse {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
  };
  points: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  totalPurchases: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async listCustomers(search?: string): Promise<CustomerLoyaltyResponse[]> {
    const customers = await this.prismaService.user.findMany({
      where: {
        role: Role.CUSTOMER,
        ...(search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        loyalty: true,
        orders: {
          where: {
            status: { not: 'CANCELLED' },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return customers.map((customer) => {
      const totalPurchases = customer.orders.length;
      const totalSpent = customer.orders.reduce((sum, o) => sum + o.total, 0);

      return {
        id: customer.loyalty?.id || '',
        userId: customer.id,
        user: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phoneNumber: customer.phoneNumber,
        },
        points: customer.loyalty?.points || 0,
        totalPointsEarned: customer.loyalty?.totalPointsEarned || 0,
        totalPointsSpent: customer.loyalty?.totalPointsSpent || 0,
        totalPurchases,
        totalSpent,
        createdAt: customer.loyalty?.createdAt || customer.createdAt,
        updatedAt: customer.loyalty?.updatedAt || customer.updatedAt,
      };
    });
  }

  async adjustPoints(
    userId: string,
    points: number,
    description?: string,
    actor?: { id: string; email?: string },
  ): Promise<CustomerLoyaltyResponse> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId, role: Role.CUSTOMER },
      include: { orders: { where: { status: { not: 'CANCELLED' } } } },
    });

    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    const oldLoyalty = await this.prismaService.customerLoyalty.findUnique({
      where: { userId },
    });
    const oldPoints = oldLoyalty?.points ?? 0;

    const loyalty = await this.prismaService.customerLoyalty.upsert({
      where: { userId },
      create: {
        userId,
        points: Math.max(0, points),
        totalPointsEarned: points > 0 ? points : 0,
        totalPointsSpent: points < 0 ? Math.abs(points) : 0,
      },
      update: {
        points: {
          increment: points,
        },
        totalPointsEarned: points > 0 ? { increment: points } : undefined,
        totalPointsSpent:
          points < 0 ? { increment: Math.abs(points) } : undefined,
      },
      include: { user: true },
    });

    await this.prismaService.loyaltyTransaction.create({
      data: {
        loyaltyId: loyalty.id,
        type: points > 0 ? 'EARN' : 'SPEND',
        amount: Math.abs(points),
        description,
      },
    });

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        actorRole: undefined,
        entityType: 'Loyalty',
        entityId: loyalty.id,
        action: 'ADJUST_POINTS',
        description: `Adjusted points for ${user.firstName} ${user.lastName}: ${points > 0 ? '+' : ''}${points} pts${description ? ` (${description})` : ''}`,
        changes: {
          points: { old: oldPoints, new: loyalty.points },
        },
      });
    }

    const totalPurchases = user.orders.length;
    const totalSpent = user.orders.reduce((sum, o) => sum + o.total, 0);

    return {
      id: loyalty.id,
      userId: loyalty.userId,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      points: loyalty.points,
      totalPointsEarned: loyalty.totalPointsEarned,
      totalPointsSpent: loyalty.totalPointsSpent,
      totalPurchases,
      totalSpent,
      createdAt: loyalty.createdAt,
      updatedAt: loyalty.updatedAt,
    };
  }
}
