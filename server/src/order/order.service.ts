import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  NotificationType,
  PaymentMethod,
  Role,
} from '../generated/prisma';
import { NotificationService } from '../notification/notification.service';

const POINTS_PER_DINAR = 1;
const POINTS_REDEMPTION_RATE = 0.05; // 10 points = 0.5 DT => 1 point = 0.05 DT

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prismaService.product.findMany({
      where: { id: { in: productIds }, status: 'ACTIVE' },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are unavailable');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { influencerTrackingLinkId: true },
    });
    const explicitInfluencerTrackingLinkId =
      await this.resolveInfluencerTrackingLinkId(dto.influencerTrackingCode);
    const influencerTrackingLinkId =
      explicitInfluencerTrackingLinkId ?? user?.influencerTrackingLinkId ?? null;

    let subtotal = 0;
    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product)
        throw new BadRequestException(
          `Product ${item.productId} is unavailable`,
        );
      const price = product.discountPrice ?? product.price;
      subtotal += price * item.quantity;

      const images = product.images as string[];
      const firstImage =
        Array.isArray(images) && images.length > 0 ? images[0] : null;

      return {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        image: firstImage,
        price,
        quantity: item.quantity,
      };
    });

    // Promo code discount
    let promoDiscount = 0;
    let promoCodeId: string | null = null;

    if (dto.promoCode?.trim()) {
      const code = dto.promoCode.trim().toUpperCase();
      const promo = await this.prismaService.promoCode.findUnique({
        where: { code },
      });

      if (!promo || promo.status !== 'ACTIVE') {
        throw new BadRequestException('Invalid or inactive promo code');
      }

      const now = new Date();
      if (promo.startDate > now) {
        throw new BadRequestException('Promo code is not yet active');
      }
      if (!promo.isLifetime && promo.expiration && promo.expiration < now) {
        throw new BadRequestException('Promo code has expired');
      }

      if (promo.usageLimit !== null) {
        const usageCount = await this.prismaService.order.count({
          where: {
            userId,
            promoCodeId: promo.id,
            status: { not: 'CANCELLED' },
          },
        });
        if (usageCount >= promo.usageLimit) {
          throw new BadRequestException(
            'You have reached the usage limit for this promo code',
          );
        }
      }

      // Determine the base amount the discount applies to
      let discountBase = subtotal;
      if (promo.productId) {
        const scopedItems = orderItems.filter(
          (item) => item.productId === promo.productId,
        );
        if (scopedItems.length === 0) {
          throw new BadRequestException(
            'This promo code does not apply to any item in your order',
          );
        }
        discountBase = scopedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
      }

      if (promo.discountType === 'FIXED') {
        promoDiscount = Math.min(promo.value, discountBase);
      } else {
        promoDiscount = discountBase * (promo.value / 100);
      }

      promoCodeId = promo.id;
    }

    // Points redemption
    let pointsUsed = 0;
    let pointsDiscount = 0;

    if (dto.pointsToUse && dto.pointsToUse > 0) {
      const loyalty = await this.prismaService.customerLoyalty.findUnique({
        where: { userId },
      });
      const availablePoints = loyalty?.points ?? 0;
      pointsUsed = Math.min(dto.pointsToUse, availablePoints);
      pointsDiscount = pointsUsed * POINTS_REDEMPTION_RATE;
    }

    const total = Math.max(0, subtotal - promoDiscount - pointsDiscount);

    const order = await this.prismaService.order.create({
      data: {
        userId,
        paymentMethod: dto.paymentMethod as PaymentMethod,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        secondPhone: dto.secondPhone ?? null,
        address: dto.address,
        city: dto.city,
        postalCode: dto.postalCode,
        subtotal,
        discount: promoDiscount,
        pointsUsed,
        total,
        promoCodeId,
        influencerTrackingLinkId,
        items: { create: orderItems },
      },
      include: { items: true },
    });

    // Deduct redeemed points
    if (pointsUsed > 0) {
      const loyalty = await this.prismaService.customerLoyalty.upsert({
        where: { userId },
        create: { userId, points: 0, totalPointsEarned: 0, totalPointsSpent: 0 },
        update: {
          points: { decrement: pointsUsed },
          totalPointsSpent: { increment: pointsUsed },
        },
      });
      await this.prismaService.loyaltyTransaction.create({
        data: {
          loyaltyId: loyalty.id,
          type: 'SPEND',
          amount: pointsUsed,
          description: `Redeemed on order #${order.id.slice(-6).toUpperCase()}`,
          orderId: order.id,
        },
      });
    }

    // Update promo code stats
    if (promoCodeId) {
      await this.prismaService.promoCode.update({
        where: { id: promoCodeId },
        data: {
          totalUsage: { increment: 1 },
          totalRevenue: { increment: total },
        },
      });
    }

    const customerName = `${order.firstName} ${order.lastName}`.trim();
    const shortOrderId = order.id.slice(-6).toUpperCase();

    await Promise.all([
      this.notificationService.createNotification({
        userId,
        type: NotificationType.ORDER_CREATED,
        title: 'Order created successfully',
        message: `Your order #${shortOrderId} was created successfully. We will notify you as soon as its status changes.`,
        data: {
          orderId: order.id,
          status: order.status,
          total: order.total,
        },
      }),
      this.notificationService.createNotificationsForRoles({
        roles: [Role.ADMIN, Role.VENDOR],
        type: NotificationType.ORDER_CREATED,
        title: 'New order received',
        message: `${customerName} placed order #${shortOrderId} for ${order.total.toFixed(2)} TND.`,
        data: {
          orderId: order.id,
          customerId: userId,
          status: order.status,
          total: order.total,
        },
      }),
    ]);

    return order;
  }

  async validatePromoCode(code: string, userId: string, subtotal: number) {
    const promo = await this.prismaService.promoCode.findUnique({
      where: { code: code.trim().toUpperCase() },
      select: {
        id: true,
        code: true,
        discountType: true,
        value: true,
        productId: true,
        usageLimit: true,
        isLifetime: true,
        expiration: true,
        startDate: true,
        status: true,
      },
    });

    if (!promo || promo.status !== 'ACTIVE') {
      throw new BadRequestException('Invalid or inactive promo code');
    }

    const now = new Date();
    if (promo.startDate > now) {
      throw new BadRequestException('Promo code is not yet active');
    }
    if (!promo.isLifetime && promo.expiration && promo.expiration < now) {
      throw new BadRequestException('Promo code has expired');
    }

    if (promo.usageLimit !== null) {
      const usageCount = await this.prismaService.order.count({
        where: { userId, promoCodeId: promo.id, status: { not: 'CANCELLED' } },
      });
      if (usageCount >= promo.usageLimit) {
        throw new BadRequestException(
          'You have reached the usage limit for this promo code',
        );
      }
    }

    let discountBase = subtotal;
    if (promo.productId) {
      discountBase = 0; // caller must supply product-level subtotal; we return productId so frontend knows
    }

    let discountAmount = 0;
    if (discountBase > 0) {
      if (promo.discountType === 'FIXED') {
        discountAmount = Math.min(promo.value, discountBase);
      } else {
        discountAmount = discountBase * (promo.value / 100);
      }
    }

    return {
      code: promo.code,
      discountType: promo.discountType,
      value: promo.value,
      productId: promo.productId,
      discountAmount,
    };
  }

  async getMyLoyalty(userId: string) {
    const loyalty = await this.prismaService.customerLoyalty.findUnique({
      where: { userId },
      select: { points: true, totalPointsEarned: true, totalPointsSpent: true },
    });
    return {
      points: loyalty?.points ?? 0,
      totalPointsEarned: loyalty?.totalPointsEarned ?? 0,
      totalPointsSpent: loyalty?.totalPointsSpent ?? 0,
    };
  }

  async getUserOrders(userId: string) {
    return this.prismaService.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.prismaService.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getAllOrders() {
    return this.prismaService.order.findMany({
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    actor?: { id: string; email?: string },
  ) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const oldStatus = order.status;

    const updatedOrder = await this.prismaService.order.update({
      where: { id: orderId },
      data: { status: status as any },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const customerName =
      `${updatedOrder.user.firstName} ${updatedOrder.user.lastName}`.trim();
    const shortOrderId = updatedOrder.id.slice(-6).toUpperCase();
    const normalizedStatus = status.toLowerCase();

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        actorRole: undefined,
        entityType: 'Order',
        entityId: orderId,
        action: 'STATUS_CHANGE',
        description: `Changed order #${shortOrderId} status from ${oldStatus} to ${status}`,
        changes: {
          status: { old: oldStatus, new: status },
        },
      });
    }

    // Award points when order is delivered (1 point per dinar of the final total)
    if (status === 'DELIVERED' && oldStatus !== 'DELIVERED') {
      const pointsToAward = Math.floor(updatedOrder.total * POINTS_PER_DINAR);
      if (pointsToAward > 0) {
        const loyalty = await this.prismaService.customerLoyalty.upsert({
          where: { userId: updatedOrder.userId },
          create: {
            userId: updatedOrder.userId,
            points: pointsToAward,
            totalPointsEarned: pointsToAward,
            totalPointsSpent: 0,
          },
          update: {
            points: { increment: pointsToAward },
            totalPointsEarned: { increment: pointsToAward },
          },
        });
        await this.prismaService.loyaltyTransaction.create({
          data: {
            loyaltyId: loyalty.id,
            type: 'EARN',
            amount: pointsToAward,
            description: `Earned on order #${shortOrderId}`,
            orderId,
          },
        });
      }
    }

    await Promise.all([
      this.notificationService.createNotification({
        userId: updatedOrder.userId,
        type: NotificationType.ORDER_STATUS_CHANGED,
        title: 'Order status updated',
        message: `Your order #${shortOrderId} is now ${normalizedStatus}.`,
        data: {
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          total: updatedOrder.total,
        },
      }),
      this.notificationService.createNotificationsForRoles({
        roles: [Role.ADMIN, Role.VENDOR],
        type: NotificationType.ORDER_STATUS_CHANGED,
        title: 'Order status changed',
        message: `Order #${shortOrderId} for ${customerName} is now ${status}.`,
        data: {
          orderId: updatedOrder.id,
          customerId: updatedOrder.userId,
          status: updatedOrder.status,
          total: updatedOrder.total,
        },
      }),
    ]);

    return updatedOrder;
  }

  private async resolveInfluencerTrackingLinkId(
    code?: string,
  ): Promise<string | null> {
    const normalizedCode = code?.trim().toLowerCase();

    if (!normalizedCode) {
      return null;
    }

    const trackingLink =
      await this.prismaService.influencerTrackingLink.findFirst({
        where: {
          code: normalizedCode,
          status: 'ACTIVE',
        },
        select: { id: true },
      });

    return trackingLink?.id ?? null;
  }
}
