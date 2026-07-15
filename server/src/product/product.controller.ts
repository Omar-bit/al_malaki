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
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ProductService,
  ProductResponse,
  CategoryResponse,
} from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma';

const storage = diskStorage({
  destination: './uploads/products',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    cb(null, `${randomName}${extname(file.originalname)}`);
  },
});

const categoryStorage = diskStorage({
  destination: './uploads/categories',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    cb(null, `${randomName}${extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        'Only image files are allowed (jpeg, png, webp, gif)',
      ),
      false,
    );
  }
};

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
  async createProduct(@Body() dto: CreateProductDto): Promise<ProductResponse> {
    return this.productService.createProduct(dto);
  }

  @Patch('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponse> {
    return this.productService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProduct(@Param('id') id: string): Promise<void> {
    return this.productService.deleteProduct(id);
  }

  @Post('products/upload-images')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage,
      fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
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
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponse> {
    return this.productService.createCategory(dto);
  }

  @Post('categories/upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: categoryStorage,
      fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
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
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponse> {
    return this.productService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  async deleteCategory(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.productService.deleteCategory(id);
  }
}
