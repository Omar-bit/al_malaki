import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './cache/cache.module';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { PromoModule } from './promo/promo.module';
import { OrderModule } from './order/order.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { ContactModule } from './contact/contact.module';
import { NotificationModule } from './notification/notification.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { InfluencerTrackingModule } from './influencer-tracking/influencer-tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    // Global baseline rate limit: 120 requests / minute / IP. Sensitive auth
    // routes tighten this further with per-route @Throttle decorators.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    CacheModule,
    PrismaModule,
    AuthModule,
    AdminModule,
    ProductModule,
    PromoModule,
    OrderModule,
    LoyaltyModule,
    ContactModule,
    NotificationModule,
    ActivityLogModule,
    InfluencerTrackingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
