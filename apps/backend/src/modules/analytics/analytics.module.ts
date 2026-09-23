import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Album } from '../albums/entities/album.entity';
import { Download } from '../downloads/entities/download.entity';
import { Order } from '../orders/entities/order.entity';
import { Photo } from '../photos/entities/photo.entity';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsEvent, Order, Download, Photo, Album]),
    ConfigModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
