import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../admin/guards/admin.guard';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OrderController],
  providers: [OrderService, AdminGuard],
})
export class OrderModule {}
