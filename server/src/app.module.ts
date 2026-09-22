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
import { RealtimeModule } from './realtime/realtime.module';
import { RedisThrottlerStorage } from './common/throttler/redis-throttler.storage';

/**
 * Serves uploaded images from the app itself. Set `SERVE_UPLOADS_FROM_APP=false`
 * where a reverse proxy serves `/uploads` off the same volume instead, so the
 * Node process never spends a worker on static file I/O.
 */
const shouldServeUploadsFromApp =
  process.env.SERVE_UPLOADS_FROM_APP === 'true' ||
  (process.env.SERVE_UPLOADS_FROM_APP === undefined &&
    process.env.NODE_ENV !== 'production');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    // Global baseline rate limit: 120 requests / minute / IP. Sensitive auth
    // routes tighten this further with per-route @Throttle decorators.
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 120,
        },
      ],
      // Counters live in Redis so the limit is enforced across all workers.
      storage: new RedisThrottlerStorage(),
    }),
    ...(shouldServeUploadsFromApp
      ? [
          ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
          }),
        ]
      : []),
    RealtimeModule,
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
