import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { CreateCategoryDto } from './dto/create-category.dto';

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
}
