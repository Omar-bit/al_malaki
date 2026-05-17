import { Controller, Get } from '@nestjs/common';
import { ProductService, ProductResponse, CategoryResponse } from './product.service';

@Controller('public')
export class PublicProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('products')
  async listProducts(): Promise<ProductResponse[]> {
    return this.productService.listProducts();
  }

  @Get('categories')
  async listCategories(): Promise<CategoryResponse[]> {
    return this.productService.listCategories();
  }
}
