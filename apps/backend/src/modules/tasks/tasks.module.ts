import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEvent } from '../analytics/entities/analytics-event.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { DiscoveryModule } from '../discovery/discovery.module';
import { RevenueModule } from '../revenue/revenue.module';
import { SeoModule } from '../seo/seo.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsEvent, Notification]),
    DiscoveryModule,
    RevenueModule,
    SeoModule,
    SubscriptionsModule,
  ],
  providers: [TasksService],
})
export class TasksModule {}
