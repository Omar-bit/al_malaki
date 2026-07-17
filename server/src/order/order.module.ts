import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../admin/guards/admin.guard';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, AuthModule, NotificationModule],
  controllers: [OrderController],
  providers: [OrderService, AdminGuard],
})
export class OrderModule {}
