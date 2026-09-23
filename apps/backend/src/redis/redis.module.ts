import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { RedisConfig } from '../config/configuration';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';

export { REDIS_CLIENT };

/**
 * Global Redis module. Provides a single shared ioredis client plus a thin
 * RedisService wrapper used for caching, refresh-token denylists, and rate-limit
 * counters. Declared @Global so any module can inject RedisService without re-importing.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const cfg = configService.getOrThrow<RedisConfig>('redis');
        return new Redis({
          host: cfg.host,
          port: cfg.port,
          password: cfg.password,
          db: cfg.db,
          maxRetriesPerRequest: 3,
          lazyConnect: false,
          retryStrategy: (times) => Math.min(times * 200, 2000),
        });
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
