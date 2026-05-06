import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

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
}

export interface CategoryResponse {
  id: string;
  name: string;
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

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category?.name ?? 'Uncategorized',
      brand: product.brand ?? undefined,
      description: product.description ?? undefined,
      price: product.price,
      discountPrice: product.discountPrice ?? undefined,
      images: Array.isArray(product.images) ? (product.images as string[]) : [],
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
    }));
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
        images: dto.images ?? [],
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
        ? (createdProduct.images as string[])
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

  async listCategories(): Promise<CategoryResponse[]> {
    return this.prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
    });
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

    return this.prisma.productCategory.create({
      data: { name: trimmedName },
    });
  }
}
