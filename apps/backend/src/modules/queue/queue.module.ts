import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { RedisConfig } from '../../config/configuration';
import { MailModule } from '../../mail/mail.module';
import { MAIL_QUEUE, MEDIA_QUEUE } from './queue.constants';
import { MediaProcessor } from './media.processor';
import { MailProcessor } from './mail.processor';
import { QueueService } from './queue.service';

// Workers only consume on instances where RUN_WORKERS is enabled (the API dynos
// just enqueue). Producers (QueueService) are always available.
const RUN_WORKERS = process.env.RUN_WORKERS === 'true';

/**
 * BullMQ-backed async job processing. Heavy media work and digest emails are
 * pushed to Redis-backed queues and handled by worker processes, keeping the
 * request path fast and horizontally scalable.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const cfg = config.getOrThrow<RedisConfig>('redis');
        return {
          // BullMQ manages its own connections (blocking commands need
          // maxRetriesPerRequest: null), so we pass options, not the shared client.
          connection: { host: cfg.host, port: cfg.port, password: cfg.password, db: cfg.db },
        };
      },
    }),
    BullModule.registerQueue({ name: MEDIA_QUEUE }, { name: MAIL_QUEUE }),
    MailModule,
  ],
  providers: [QueueService, ...(RUN_WORKERS ? [MediaProcessor, MailProcessor] : [])],
  exports: [QueueService],
})
export class QueueModule {}
