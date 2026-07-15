import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

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
  primaryPlacement?: string;
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
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(): Promise<ProductResponse[]> {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });

    // Compute per-product sales from order items
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: { status: { not: 'CANCELLED' } },
      },
      select: {
        productId: true,
        quantity: true,
        createdAt: true,
      },
    });

    const productSalesMap: Record<string, number> = {};
    const recentSalesMap: Record<string, number> = {};
    const previousSalesMap: Record<string, number> = {};

    for (const item of orderItems) {
      const pid = item.productId;
      if (!pid) continue;

      productSalesMap[pid] = (productSalesMap[pid] || 0) + item.quantity;

      if (item.createdAt >= thirtyDaysAgo) {
        recentSalesMap[pid] = (recentSalesMap[pid] || 0) + item.quantity;
      } else if (item.createdAt >= sixtyDaysAgo) {
        previousSalesMap[pid] = (previousSalesMap[pid] || 0) + item.quantity;
      }
    }

    return products.map((product) => {
      const pid = product.id;
      const totalSales = productSalesMap[pid] || 0;
      const recent = recentSalesMap[pid] || 0;
      const previous = previousSalesMap[pid] || 0;

      let trend: string | undefined;
      if (previous > 0) {
        const pct = ((recent - previous) / previous) * 100;
        trend = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
      } else if (recent > 0) {
        trend = '+100%';
      }

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
        primaryPlacement: product.primaryPlacement ?? undefined,
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
        totalSales,
        trend,
      };
    });
  }

  async getProductBySlug(slug: string): Promise<ProductResponse> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

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
      primaryPlacement: product.primaryPlacement ?? undefined,
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
    };
  }

  async createProduct(dto: CreateProductDto): Promise<ProductResponse> {
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
        primaryPlacement: dto.primaryPlacement?.trim() || null,
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

    return {
      id: createdProduct.id,
      name: createdProduct.name,
      category: createdProduct.category?.name ?? 'Uncategorized',
      brand: createdProduct.brand ?? undefined,
      description: createdProduct.description ?? undefined,
      price: createdProduct.price,
      discountPrice: createdProduct.discountPrice ?? undefined,
      images: Array.isArray(createdProduct.images)
        ? (createdProduct.images as string[]).map(
            (img) => getProductUrl(img) as string,
          )
        : [],
      primaryPlacement: createdProduct.primaryPlacement ?? undefined,
      collection: createdProduct.collection ?? undefined,
      promoCode: createdProduct.promoCode ?? undefined,
      campaign: createdProduct.campaign ?? undefined,
      status: createdProduct.status.toLowerCase() as 'active' | 'hidden',
      performance:
        performanceReverseMap[
          createdProduct.performance as
            | 'NEW_ARRIVAL'
            | 'RECOMMENDED'
            | 'FEATURED'
        ],
      slug: createdProduct.slug,
      metaTitle: createdProduct.metaTitle ?? undefined,
      metaDescription: createdProduct.metaDescription ?? undefined,
      createdAt: createdProduct.createdAt,
      updatedAt: createdProduct.updatedAt,
    };
  }

  async updateProduct(
    id: string,
    dto: UpdateProductDto,
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

    const updateData: any = {};
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
    if (dto.primaryPlacement !== undefined)
      updateData.primaryPlacement = dto.primaryPlacement?.trim() || null;
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

    return {
      id: updatedProduct.id,
      name: updatedProduct.name,
      category: updatedProduct.category?.name ?? 'Uncategorized',
      brand: updatedProduct.brand ?? undefined,
      description: updatedProduct.description ?? undefined,
      price: updatedProduct.price,
      discountPrice: updatedProduct.discountPrice ?? undefined,
      images: Array.isArray(updatedProduct.images)
        ? (updatedProduct.images as string[]).map(
            (img) => getProductUrl(img) as string,
          )
        : [],
      primaryPlacement: updatedProduct.primaryPlacement ?? undefined,
      collection: updatedProduct.collection ?? undefined,
      promoCode: updatedProduct.promoCode ?? undefined,
      campaign: updatedProduct.campaign ?? undefined,
      status: updatedProduct.status.toLowerCase() as 'active' | 'hidden',
      performance:
        performanceReverseMap[
          updatedProduct.performance as
            | 'NEW_ARRIVAL'
            | 'RECOMMENDED'
            | 'FEATURED'
        ],
      slug: updatedProduct.slug,
      metaTitle: updatedProduct.metaTitle ?? undefined,
      metaDescription: updatedProduct.metaDescription ?? undefined,
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedProduct.updatedAt,
    };
  }

  async deleteProduct(id: string): Promise<void> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({
      where: { id },
    });
  }

  async listCategories(): Promise<CategoryResponse[]> {
    const categories = await this.prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
    });

    return categories.map((category) => ({
      ...category,
      image: getCategoryUrl(category.image),
      color: category.color ?? undefined,
    }));
  }

  async createCategory(dto: CreateCategoryDto): Promise<CategoryResponse> {
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

    return {
      ...created,
      image: getCategoryUrl(created.image),
      color: created.color ?? undefined,
    };
  }

  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
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

    return {
      ...updated,
      image: getCategoryUrl(updated.image),
      color: updated.color ?? undefined,
    };
  }

  async deleteCategory(id: string): Promise<{ message: string }> {
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
    return { message: 'Category deleted successfully' };
  }
}
