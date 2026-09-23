import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StorageConfig } from '../config/configuration';
import { ImageProcessingService } from './image-processing.service';
import { LocalStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';
import { StorageService } from './storage.service';
import { WatermarkService } from './watermark.service';

/**
 * Binds the StorageService port to S3 when configured, otherwise to local disk.
 * Declared @Global so PhotosModule (and future modules) inject it directly.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    ImageProcessingService,
    WatermarkService,
    {
      provide: StorageService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): StorageService => {
        const storage = configService.getOrThrow<StorageConfig>('storage');
        return storage.enabled
          ? new S3StorageService(configService)
          : new LocalStorageService(configService);
      },
    },
  ],
  exports: [StorageService, ImageProcessingService, WatermarkService],
})
export class StorageModule {}
