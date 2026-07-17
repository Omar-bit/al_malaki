import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../admin/guards/admin.guard';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, AuthModule, NotificationModule],
  controllers: [ContactController],
  providers: [ContactService, AdminGuard],
})
export class ContactModule {}
