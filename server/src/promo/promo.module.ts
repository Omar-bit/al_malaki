import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PromoController } from './promo.controller';
import { PromoService } from './promo.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PromoController],
  providers: [PromoService],
})
export class PromoModule {}
