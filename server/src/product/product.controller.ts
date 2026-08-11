import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import {
  ProductService,
  ProductResponse,
  CategoryResponse,
} from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma';
import { createImageUploadOptions } from '../common/storage/upload-storage';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@Roles(Role.ADMIN, Role.VENDOR)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('products')
  async listProducts(): Promise<ProductResponse[]> {
    return this.productService.listProducts();
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  async createProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto,
  ): Promise<ProductResponse> {
    return this.productService.createProduct(dto, {
      id: user.userId,
      email: user.email,
    });
  }

  @Patch('products/:id')
  async updateProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponse> {
    return this.productService.updateProduct(id, dto, {
      id: user.userId,
      email: user.email,
    });
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.productService.deleteProduct(id, {
      id: user.userId,
      email: user.email,
    });
  }

  @Post('products/upload-images')
  @UseInterceptors(
    FilesInterceptor(
      'images',
      10,
      createImageUploadOptions('./uploads/products'),
    ),
  )
  async uploadProductImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const urls = files.map((file) => `/uploads/products/${file.filename}`);
    return { urls };
  }

  @Get('categories')
  async listCategories(): Promise<CategoryResponse[]> {
    return this.productService.listCategories();
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponse> {
    return this.productService.createCategory(dto, {
      id: user.userId,
      email: user.email,
    });
  }

  @Post('categories/upload-image')
  @UseInterceptors(
    FileInterceptor('image', createImageUploadOptions('./uploads/categories')),
  )
  async uploadCategoryImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return { url: `/uploads/categories/${file.filename}` };
  }

  @Patch('categories/:id')
  async updateCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponse> {
    return this.productService.updateCategory(id, dto, {
      id: user.userId,
      email: user.email,
    });
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  async deleteCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.productService.deleteCategory(id, {
      id: user.userId,
      email: user.email,
    });
  }
}
