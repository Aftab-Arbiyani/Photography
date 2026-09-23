import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import type Redis from 'ioredis';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import type { AppConfig, ThrottleConfig } from './config/configuration';
import { configurations } from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import { RedisModule } from './redis/redis.module';
import { REDIS_CLIENT } from './redis/redis.constants';
import { FailOpenThrottlerStorage } from './redis/throttler-fail-open.storage';
import { StorageModule } from './storage/storage.module';
import { AlbumsModule } from './modules/albums/albums.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { PhotosModule } from './modules/photos/photos.module';
import { UsersModule } from './modules/users/users.module';
// Phase 3 — marketplace
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { CartModule } from './modules/cart/cart.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DownloadsModule } from './modules/downloads/downloads.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
// Phase 4 — community / social
import { FollowsModule } from './modules/follows/follows.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TagsModule } from './modules/tags/tags.module';
import { SharingModule } from './modules/sharing/sharing.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SearchModule } from './modules/search/search.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuditInterceptor } from './modules/audit/audit.interceptor';
// Phase 5 — scale / platform
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PhotographersModule } from './modules/photographers/photographers.module';
import { RevenueModule } from './modules/revenue/revenue.module';
import { PlatformModule } from './modules/platform/platform.module';
import { SeoModule } from './modules/seo/seo.module';
import { QueueModule } from './modules/queue/queue.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: configurations,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
      envFilePath: ['.env', '../../.env'],
    }),

    // Structured request logging (pino). Pretty-prints in development.
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const app = configService.getOrThrow<AppConfig>('app');
        return {
          pinoHttp: {
            level: app.env === 'production' ? 'info' : 'debug',
            transport: app.env === 'production' ? undefined : { target: 'pino-pretty' },
            redact: ['req.headers.authorization', 'req.headers.cookie'],
            autoLogging: false,
          },
        };
      },
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService, REDIS_CLIENT],
      useFactory: (configService: ConfigService, redis: Redis) => {
        const t = configService.getOrThrow<ThrottleConfig>('throttle');
        return {
          throttlers: [{ ttl: t.ttl * 1000, limit: t.limit }],
          // Shared Redis storage so limits hold across horizontally-scaled API instances,
          // wrapped to fail open: a Redis outage must not 500 every throttled route.
          storage: new FailOpenThrottlerStorage(new ThrottlerStorageRedisService(redis)),
        };
      },
    }),

    DatabaseModule,
    RedisModule,
    MailModule,
    StorageModule,

    // Feature modules
    AuthModule,
    UsersModule,
    PhotosModule,
    CategoriesModule,
    AlbumsModule,
    CollectionsModule,
    // Phase 3 — marketplace
    NotificationsModule,
    CouponsModule,
    CartModule,
    MarketplaceModule,
    ReviewsModule,
    WishlistModule,
    OrdersModule,
    PaymentsModule,
    DownloadsModule,
    // Phase 4 — community / social
    AuditModule,
    FollowsModule,
    ReportsModule,
    TagsModule,
    SharingModule,
    AnalyticsModule,
    SearchModule,
    DiscoveryModule,
    // Phase 5 — scale / platform
    ScheduleModule.forRoot(),
    PlatformModule,
    SubscriptionsModule,
    PhotographersModule,
    RevenueModule,
    SeoModule,
    QueueModule,
    // Scheduled jobs run only where RUN_CRON !== 'false' — keep them on a single
    // worker in a clustered deploy (see ecosystem.config.cjs) to avoid double-firing.
    ...(process.env.RUN_CRON === 'false' ? [] : [TasksModule]),
    HealthModule,
  ],
  providers: [
    // Global validation — strips unknown props, transforms primitives.
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
    // Order matters: rate-limit → authenticate → authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Response envelope + timing.
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    // Append-only audit trail of authenticated mutations.
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    // Catch-all error normalization.
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
