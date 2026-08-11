import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CacheService } from '../cache/cache.service';
import { OrderStatus, Prisma } from '../generated/prisma';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

interface ProductSales {
  totalSales: number;
  trend?: string;
}

const PRODUCT_CACHE_TTL_MS = 60_000;

const CACHE_KEYS = {
  publicProducts: 'products:public:list',
  landingProducts: 'products:public:landing',
  categories: 'categories:list',
  productSlug: (slug: string) => `product:slug:${slug}`,
};

const extractFilename = (
  url: string | null | undefined,
): string | undefined => {
  if (!url) return undefined;
  const parts = url.split('/');
  return parts[parts.length - 1];
};

const getCategoryUrl = (
  filename: string | null | undefined,
): string | undefined => {
  if (!filename) return undefined;
  if (filename.startsWith('http')) return filename;
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/categories/${filename}`;
};

const getProductUrl = (
  filename: string | null | undefined,
): string | undefined => {
  if (!filename) return undefined;
  if (filename.startsWith('http')) return filename;
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/products/${filename}`;
};

export interface ProductResponse {
  id: string;
  name: string;
  category: string;
  brand?: string;
  description?: string;
  price: number;
  discountPrice?: number;
  images: string[];
  placement: boolean;
  collection?: string;
  promoCode?: string;
  campaign?: string;
  status: 'active' | 'hidden';
  performance: 'new arrival' | 'recommended' | 'featured';
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  totalSales?: number;
  trend?: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  image?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const performanceMap: Record<
  CreateProductDto['performance'],
  'new_arrival' | 'recommended' | 'featured'
> = {
  'new arrival': 'new_arrival',
  recommended: 'recommended',
  featured: 'featured',
};

const performanceReverseMap: Record<
  'NEW_ARRIVAL' | 'RECOMMENDED' | 'FEATURED',
  'new arrival' | 'recommended' | 'featured'
> = {
  NEW_ARRIVAL: 'new arrival',
  RECOMMENDED: 'recommended',
  FEATURED: 'featured',
};

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
    private readonly cache: CacheService,
  ) {}

  /** Maps a Prisma product row (with category) to the API response shape. */
  private mapProduct(
    product: ProductWithCategory,
    sales?: ProductSales,
  ): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      category: product.category?.name ?? 'Uncategorized',
      brand: product.brand ?? undefined,
      description: product.description ?? undefined,
      price: product.price,
      discountPrice: product.discountPrice ?? undefined,
      images: Array.isArray(product.images)
        ? (product.images as string[]).map(
            (img) => getProductUrl(img) as string,
          )
        : [],
      placement: product.placement,
      collection: product.collection ?? undefined,
      promoCode: product.promoCode ?? undefined,
      campaign: product.campaign ?? undefined,
      status: product.status.toLowerCase() as 'active' | 'hidden',
      performance:
        performanceReverseMap[
          product.performance as 'NEW_ARRIVAL' | 'RECOMMENDED' | 'FEATURED'
        ],
      slug: product.slug,
      metaTitle: product.metaTitle ?? undefined,
      metaDescription: product.metaDescription ?? undefined,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      ...(sales ? { totalSales: sales.totalSales, trend: sales.trend } : {}),
    };
  }

  /**
   * Aggregate per-product sales in the database (three grouped sums) instead of
   * streaming every order item into memory. Used only by the admin listing.
   */
  private async computeProductSales(): Promise<Map<string, ProductSales>> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const baseWhere = {
      order: { status: { not: OrderStatus.CANCELLED } },
    } satisfies Prisma.OrderItemWhereInput;

    const [totals, recent, previous] = await Promise.all([
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: baseWhere,
        _sum: { quantity: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { ...baseWhere, createdAt: { gte: thirtyDaysAgo } },
        _sum: { quantity: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          ...baseWhere,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
        _sum: { quantity: true },
      }),
    ]);

    const recentMap = new Map(
      recent.map((row) => [row.productId, row._sum.quantity ?? 0]),
    );
    const previousMap = new Map(
      previous.map((row) => [row.productId, row._sum.quantity ?? 0]),
    );

    const result = new Map<string, ProductSales>();
    for (const row of totals) {
      if (!row.productId) continue;
      const recentSales = recentMap.get(row.productId) ?? 0;
      const previousSales = previousMap.get(row.productId) ?? 0;

      let trend: string | undefined;
      if (previousSales > 0) {
        const pct = ((recentSales - previousSales) / previousSales) * 100;
        trend = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
      } else if (recentSales > 0) {
        trend = '+100%';
      }

      result.set(row.productId, {
        totalSales: row._sum.quantity ?? 0,
        trend,
      });
    }
    return result;
  }

  /** Admin listing — includes computed sales/trend, never cached (needs freshness). */
  async listProducts(): Promise<ProductResponse[]> {
    const [products, salesMap] = await Promise.all([
      this.prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      this.computeProductSales(),
    ]);

    return products.map((product) =>
      this.mapProduct(product, salesMap.get(product.id) ?? { totalSales: 0 }),
    );
  }

  /** Public storefront listing — no sales computation, cached. */
  async listPublicProducts(): Promise<ProductResponse[]> {
    return this.cache.wrap(
      CACHE_KEYS.publicProducts,
      async () => {
        const products = await this.prisma.product.findMany({
          orderBy: { createdAt: 'desc' },
          include: { category: true },
        });
        return products.map((product) => this.mapProduct(product));
      },
      PRODUCT_CACHE_TTL_MS,
    );
  }

  async getProductBySlug(slug: string): Promise<ProductResponse> {
    return this.cache.wrap(
      CACHE_KEYS.productSlug(slug),
      async () => {
        const product = await this.prisma.product.findUnique({
          where: { slug },
          include: { category: true },
        });

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        return this.mapProduct(product);
      },
      PRODUCT_CACHE_TTL_MS,
    );
  }

  async listLandingProducts(): Promise<ProductResponse[]> {
    return this.cache.wrap(
      CACHE_KEYS.landingProducts,
      async () => {
        const products = await this.prisma.product.findMany({
          where: { placement: true },
          orderBy: { createdAt: 'desc' },
          include: { category: true },
        });
        return products.map((product) => this.mapProduct(product));
      },
      PRODUCT_CACHE_TTL_MS,
    );
  }

  private async invalidateProductCaches(slugs: string[] = []): Promise<void> {
    await this.cache.del(
      CACHE_KEYS.publicProducts,
      CACHE_KEYS.landingProducts,
      ...slugs.filter(Boolean).map((slug) => CACHE_KEYS.productSlug(slug)),
    );
  }

  private async invalidateCategoryCaches(): Promise<void> {
    // Category names are embedded in product responses, so product lists are
    // invalidated alongside the category list.
    await this.cache.del(
      CACHE_KEYS.categories,
      CACHE_KEYS.publicProducts,
      CACHE_KEYS.landingProducts,
    );
  }

  async createProduct(
    dto: CreateProductDto,
    actor?: { id: string; email?: string },
  ): Promise<ProductResponse> {
    const category = await this.prisma.productCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!dto.slug.trim()) {
      throw new BadRequestException('Slug is required');
    }

    const existingSlug = await this.prisma.product.findUnique({
      where: { slug: dto.slug.trim() },
      select: { id: true },
    });

    if (existingSlug) {
      throw new ConflictException('A product with this slug already exists');
    }

    const createdProduct = await this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        categoryId: dto.categoryId,
        brand: dto.brand?.trim() || null,
        description: dto.description?.trim() || null,
        price: dto.price,
        discountPrice: dto.discountPrice ?? null,
        images: dto.images
          ? (dto.images.map(extractFilename).filter(Boolean) as string[])
          : [],
        placement: dto.placement ?? false,
        collection: dto.collection?.trim() || null,
        promoCode: dto.promoCode?.trim() || null,
        campaign: dto.campaign?.trim() || null,
        status: dto.status.toUpperCase() as 'ACTIVE' | 'HIDDEN',
        performance: performanceMap[dto.performance].toUpperCase() as
          | 'NEW_ARRIVAL'
          | 'RECOMMENDED'
          | 'FEATURED',
        slug: dto.slug.trim(),
        metaTitle: dto.metaTitle?.trim() || null,
        metaDescription: dto.metaDescription?.trim() || null,
      },
      include: { category: true },
    });

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        actorRole: undefined,
        entityType: 'Product',
        entityId: createdProduct.id,
        action: 'CREATE',
        description: `Created product "${createdProduct.name}"`,
      });
    }

    await this.invalidateProductCaches([createdProduct.slug]);

    return this.mapProduct(createdProduct);
  }

  async updateProduct(
    id: string,
    dto: UpdateProductDto,
    actor?: { id: string; email?: string },
  ): Promise<ProductResponse> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    if (dto.categoryId) {
      const category = await this.prisma.productCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    if (dto.slug !== undefined) {
      if (!dto.slug.trim()) {
        throw new BadRequestException('Slug cannot be empty');
      }
      const existingSlug = await this.prisma.product.findUnique({
        where: { slug: dto.slug.trim() },
        select: { id: true },
      });
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException('A product with this slug already exists');
      }
    }

    const updateData: Prisma.ProductUncheckedUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.brand !== undefined) updateData.brand = dto.brand?.trim() || null;
    if (dto.description !== undefined)
      updateData.description = dto.description?.trim() || null;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.discountPrice !== undefined)
      updateData.discountPrice = dto.discountPrice ?? null;
    if (dto.images !== undefined)
      updateData.images = dto.images
        ? (dto.images.map(extractFilename).filter(Boolean) as string[])
        : [];
    if (dto.placement !== undefined) updateData.placement = dto.placement;
    if (dto.collection !== undefined)
      updateData.collection = dto.collection?.trim() || null;
    if (dto.promoCode !== undefined)
      updateData.promoCode = dto.promoCode?.trim() || null;
    if (dto.campaign !== undefined)
      updateData.campaign = dto.campaign?.trim() || null;
    if (dto.status !== undefined)
      updateData.status = dto.status.toUpperCase() as 'ACTIVE' | 'HIDDEN';
    if (dto.performance !== undefined)
      updateData.performance = performanceMap[dto.performance].toUpperCase() as
        | 'NEW_ARRIVAL'
        | 'RECOMMENDED'
        | 'FEATURED';
    if (dto.slug !== undefined) updateData.slug = dto.slug.trim();
    if (dto.metaTitle !== undefined)
      updateData.metaTitle = dto.metaTitle?.trim() || null;
    if (dto.metaDescription !== undefined)
      updateData.metaDescription = dto.metaDescription?.trim() || null;

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    if (actor) {
      const changes: Record<string, { old: unknown; new: unknown }> = {};
      const fieldMap: Record<string, string> = {
        name: 'name',
        categoryId: 'category',
        brand: 'brand',
        description: 'description',
        price: 'price',
        discountPrice: 'discount price',
        status: 'status',
        performance: 'performance',
        slug: 'slug',
        placement: 'placement',
        collection: 'collection',
        promoCode: 'promo code',
        campaign: 'campaign',
        metaTitle: 'meta title',
        metaDescription: 'meta description',
      };
      for (const [key, label] of Object.entries(fieldMap)) {
        if (key in updateData && existingProduct[key] !== updateData[key]) {
          changes[label] = { old: existingProduct[key], new: updateData[key] };
        }
      }
      if (Object.keys(changes).length > 0) {
        await this.activityLogService.log({
          actorId: actor.id,
          actorName: actor.email,
          actorRole: undefined,
          entityType: 'Product',
          entityId: id,
          action: 'UPDATE',
          description: `Updated product "${updatedProduct.name}"`,
          changes,
        });
      }
    }

    await this.invalidateProductCaches([
      existingProduct.slug,
      updatedProduct.slug,
    ]);

    return this.mapProduct(updatedProduct);
  }

  async deleteProduct(
    id: string,
    actor?: { id: string; email?: string },
  ): Promise<void> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        actorRole: undefined,
        entityType: 'Product',
        entityId: id,
        action: 'DELETE',
        description: `Deleted product "${existingProduct.name}"`,
      });
    }

    await this.invalidateProductCaches([existingProduct.slug]);
  }

  async listCategories(): Promise<CategoryResponse[]> {
    return this.cache.wrap(
      CACHE_KEYS.categories,
      async () => {
        const categories = await this.prisma.productCategory.findMany({
          orderBy: { name: 'asc' },
        });

        return categories.map((category) => ({
          ...category,
          image: getCategoryUrl(category.image),
          color: category.color ?? undefined,
        }));
      },
      PRODUCT_CACHE_TTL_MS,
    );
  }

  async createCategory(
    dto: CreateCategoryDto,
    actor?: { id: string; email?: string },
  ): Promise<CategoryResponse> {
    const trimmedName = dto.name.trim();

    if (!trimmedName) {
      throw new BadRequestException('Category name is required');
    }

    const existingCategory = await this.prisma.productCategory.findUnique({
      where: { name: trimmedName },
      select: { id: true },
    });

    if (existingCategory) {
      throw new ConflictException('Category already exists');
    }

    const created = await this.prisma.productCategory.create({
      data: {
        name: trimmedName,
        image: extractFilename(dto.image?.trim()) || null,
        color: dto.color?.trim() || null,
      },
    });

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        actorRole: undefined,
        entityType: 'ProductCategory',
        entityId: created.id,
        action: 'CREATE',
        description: `Created category "${trimmedName}"`,
      });
    }

    await this.invalidateCategoryCaches();

    return {
      ...created,
      image: getCategoryUrl(created.image),
      color: created.color ?? undefined,
    };
  }

  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
    actor?: { id: string; email?: string },
  ): Promise<CategoryResponse> {
    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      if (!trimmedName) {
        throw new BadRequestException('Category name cannot be empty');
      }
      if (trimmedName !== existing.name) {
        const conflict = await this.prisma.productCategory.findUnique({
          where: { name: trimmedName },
          select: { id: true },
        });
        if (conflict) {
          throw new ConflictException(
            'A category with this name already exists',
          );
        }
      }
    }

    const updated = await this.prisma.productCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.image !== undefined && {
          image: extractFilename(dto.image) || null,
        }),
        ...(dto.color !== undefined && { color: dto.color || null }),
      },
    });

    if (actor) {
      const changes: Record<string, { old: unknown; new: unknown }> = {};
      if (dto.name !== undefined && dto.name.trim() !== existing.name) {
        changes.name = { old: existing.name, new: dto.name.trim() };
      }
      if (dto.color !== undefined && dto.color !== existing.color) {
        changes.color = { old: existing.color, new: dto.color };
      }
      if (
        dto.image !== undefined &&
        extractFilename(dto.image) !== existing.image
      ) {
        changes.image = {
          old: existing.image,
          new: extractFilename(dto.image) || null,
        };
      }
      if (Object.keys(changes).length > 0) {
        await this.activityLogService.log({
          actorId: actor.id,
          actorName: actor.email,
          actorRole: undefined,
          entityType: 'ProductCategory',
          entityId: id,
          action: 'UPDATE',
          description: `Updated category "${updated.name}"`,
          changes,
        });
      }
    }

    await this.invalidateCategoryCaches();

    return {
      ...updated,
      image: getCategoryUrl(updated.image),
      color: updated.color ?? undefined,
    };
  }

  async deleteCategory(
    id: string,
    actor?: { id: string; email?: string },
  ): Promise<{ message: string }> {
    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (existing._count.products > 0) {
      throw new ConflictException(
        `Cannot delete: ${existing._count.products} product(s) still use this category. Reassign them first.`,
      );
    }

    await this.prisma.productCategory.delete({ where: { id } });

    if (actor) {
      await this.activityLogService.log({
        actorId: actor.id,
        actorName: actor.email,
        actorRole: undefined,
        entityType: 'ProductCategory',
        entityId: id,
        action: 'DELETE',
        description: `Deleted category "${existing.name}"`,
      });
    }

    await this.invalidateCategoryCaches();

    return { message: 'Category deleted successfully' };
  }
}
