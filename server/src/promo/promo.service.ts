import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';

export interface PromoCodeResponse {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  usageLimit?: number;
  productId?: string;
  productName?: string;
  startDate: string;
  expiration?: string;
  isLifetime: boolean;
  source?: string;
  totalUsage: number;
  totalRevenue: number;
  status: 'active' | 'expired' | 'disabled';
  createdAt: Date;
  updatedAt: Date;
}

export interface PromoStatsResponse {
  totalRevenue: number;
  totalRedemptions: number;
  activeCodes: number;
}

@Injectable()
export class PromoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async listPromoCodes(): Promise<PromoCodeResponse[]> {
    const promoCodes = await this.prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, name: true } } },
    });

    return promoCodes.map((promo) => ({
      id: promo.id,
      code: promo.code,
      discountType: promo.discountType.toLowerCase() as 'percentage' | 'fixed',
      value: promo.value,
      usageLimit: promo.usageLimit ?? undefined,
      productId: promo.productId ?? undefined,
      productName: promo.product?.name ?? undefined,
      startDate: promo.startDate.toISOString(),
      expiration: promo.expiration?.toISOString() ?? undefined,
      isLifetime: promo.isLifetime,
      source: promo.source ?? undefined,
      totalUsage: promo.totalUsage,
      totalRevenue: promo.totalRevenue,
      status: promo.status.toLowerCase() as 'active' | 'expired' | 'disabled',
      createdAt: promo.createdAt,
      updatedAt: promo.updatedAt,
    }));
  }

  async getStats(): Promise<PromoStatsResponse> {
    const [revenueResult, redemptionsResult, activeCount] = await Promise.all([
      this.prisma.promoCode.aggregate({ _sum: { totalRevenue: true } }),
      this.prisma.promoCode.aggregate({ _sum: { totalUsage: true } }),
      this.prisma.promoCode.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      totalRevenue: revenueResult._sum.totalRevenue ?? 0,
      totalRedemptions: redemptionsResult._sum.totalUsage ?? 0,
      activeCodes: activeCount,
    };
  }

  async createPromoCode(
    dto: CreatePromoDto,
    actor?: { id: string; email?: string },
  ): Promise<PromoCodeResponse> {
    const trimmedCode = dto.code.trim().toUpperCase();

    if (!trimmedCode) {
      throw new BadRequestException('Promo code is required');
    }

    const existing = await this.prisma.promoCode.findUnique({
      where: { code: trimmedCode },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('A promo code with this name already exists');
    }

    // Validate product exists if productId is provided
    if (dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
        select: { id: true },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    const created = await this.prisma.promoCode.create({
      data: {
        code: trimmedCode,
        discountType: dto.discountType.toUpperCase() as 'PERCENTAGE' | 'FIXED',
        value: dto.value,
        usageLimit: dto.usageLimit ?? null,
        productId: dto.productId || null,
        startDate: new Date(dto.startDate),
        expiration: dto.expiration ? new Date(dto.expiration) : null,
        isLifetime: dto.isLifetime,
        source: dto.source?.trim() || null,
      },
      include: { product: { select: { id: true, name: true } } },
    });

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        actorRole: undefined,
        entityType: 'PromoCode',
        entityId: created.id,
        action: 'CREATE',
        description: `Created promo code "${created.code}"`,
      });
    }

    return {
      id: created.id,
      code: created.code,
      discountType: created.discountType.toLowerCase() as
        | 'percentage'
        | 'fixed',
      value: created.value,
      usageLimit: created.usageLimit ?? undefined,
      productId: created.productId ?? undefined,
      productName: created.product?.name ?? undefined,
      startDate: created.startDate.toISOString(),
      expiration: created.expiration?.toISOString() ?? undefined,
      isLifetime: created.isLifetime,
      source: created.source ?? undefined,
      totalUsage: created.totalUsage,
      totalRevenue: created.totalRevenue,
      status: created.status.toLowerCase() as 'active' | 'expired' | 'disabled',
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async updatePromoCode(
    id: string,
    dto: UpdatePromoDto,
    actor?: { id: string; email?: string },
  ): Promise<PromoCodeResponse> {
    const existing = await this.prisma.promoCode.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Promo code not found');
    }

    if (dto.code !== undefined) {
      const trimmedCode = dto.code.trim().toUpperCase();
      if (!trimmedCode) {
        throw new BadRequestException('Promo code cannot be empty');
      }
      if (trimmedCode !== existing.code) {
        const conflict = await this.prisma.promoCode.findUnique({
          where: { code: trimmedCode },
          select: { id: true },
        });
        if (conflict) {
          throw new ConflictException(
            'A promo code with this name already exists',
          );
        }
      }
    }

    if (dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
        select: { id: true },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    const updateData: any = {};
    if (dto.code !== undefined) updateData.code = dto.code.trim().toUpperCase();
    if (dto.discountType !== undefined)
      updateData.discountType = dto.discountType.toUpperCase();
    if (dto.value !== undefined) updateData.value = dto.value;
    if (dto.usageLimit !== undefined)
      updateData.usageLimit = dto.usageLimit ?? null;
    if (dto.productId !== undefined)
      updateData.productId = dto.productId || null;
    if (dto.startDate !== undefined)
      updateData.startDate = new Date(dto.startDate);
    if (dto.expiration !== undefined)
      updateData.expiration = dto.expiration ? new Date(dto.expiration) : null;
    if (dto.isLifetime !== undefined) updateData.isLifetime = dto.isLifetime;
    if (dto.source !== undefined)
      updateData.source = dto.source?.trim() || null;
    if (dto.status !== undefined) updateData.status = dto.status.toUpperCase();

    const updated = await this.prisma.promoCode.update({
      where: { id },
      data: updateData,
      include: { product: { select: { id: true, name: true } } },
    });

    if (actor) {
      const changes: Record<string, { old: unknown; new: unknown }> = {};
      const fieldMap: Record<string, string> = {
        code: 'code',
        discountType: 'discount type',
        value: 'value',
        usageLimit: 'usage limit',
        productId: 'product',
        startDate: 'start date',
        expiration: 'expiration',
        isLifetime: 'lifetime',
        source: 'source',
        status: 'status',
      };
      for (const [key, label] of Object.entries(fieldMap)) {
        if (key in updateData && existing[key] !== updateData[key]) {
          changes[label] = { old: existing[key], new: updateData[key] };
        }
      }
      if (Object.keys(changes).length > 0) {
        await this.activityLogService.log({
          actorId: actor.id,
          actorName: actor.email,
          actorRole: undefined,
          entityType: 'PromoCode',
          entityId: id,
          action: 'UPDATE',
          description: `Updated promo code "${updated.code}"`,
          changes,
        });
      }
    }

    return {
      id: updated.id,
      code: updated.code,
      discountType: updated.discountType.toLowerCase() as
        | 'percentage'
        | 'fixed',
      value: updated.value,
      usageLimit: updated.usageLimit ?? undefined,
      productId: updated.productId ?? undefined,
      productName: updated.product?.name ?? undefined,
      startDate: updated.startDate.toISOString(),
      expiration: updated.expiration?.toISOString() ?? undefined,
      isLifetime: updated.isLifetime,
      source: updated.source ?? undefined,
      totalUsage: updated.totalUsage,
      totalRevenue: updated.totalRevenue,
      status: updated.status.toLowerCase() as 'active' | 'expired' | 'disabled',
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deletePromoCode(
    id: string,
    actor?: { id: string; email?: string },
  ): Promise<void> {
    const existing = await this.prisma.promoCode.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Promo code not found');
    }

    await this.prisma.promoCode.delete({ where: { id } });

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        actorRole: undefined,
        entityType: 'PromoCode',
        entityId: id,
        action: 'DELETE',
        description: `Deleted promo code "${existing.code}"`,
      });
    }
  }

  async toggleStatus(
    id: string,
    actor?: { id: string; email?: string },
  ): Promise<PromoCodeResponse> {
    const existing = await this.prisma.promoCode.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Promo code not found');
    }

    const oldStatus = existing.status;
    const newStatus = existing.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

    const updated = await this.prisma.promoCode.update({
      where: { id },
      data: { status: newStatus },
      include: { product: { select: { id: true, name: true } } },
    });

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        actorRole: undefined,
        entityType: 'PromoCode',
        entityId: id,
        action: 'STATUS_CHANGE',
        description: `Toggled promo code "${updated.code}" from ${oldStatus} to ${newStatus}`,
        changes: {
          status: { old: oldStatus, new: newStatus },
        },
      });
    }

    return {
      id: updated.id,
      code: updated.code,
      discountType: updated.discountType.toLowerCase() as
        | 'percentage'
        | 'fixed',
      value: updated.value,
      usageLimit: updated.usageLimit ?? undefined,
      productId: updated.productId ?? undefined,
      productName: updated.product?.name ?? undefined,
      startDate: updated.startDate.toISOString(),
      expiration: updated.expiration?.toISOString() ?? undefined,
      isLifetime: updated.isLifetime,
      source: updated.source ?? undefined,
      totalUsage: updated.totalUsage,
      totalRevenue: updated.totalRevenue,
      status: updated.status.toLowerCase() as 'active' | 'expired' | 'disabled',
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
