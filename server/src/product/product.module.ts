import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProductController } from './product.controller';
import { PublicProductController } from './public-product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProductController, PublicProductController],
  providers: [ProductService],
})
export class ProductModule {}
