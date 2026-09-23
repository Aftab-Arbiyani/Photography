import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Album } from '../albums/entities/album.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Photo } from '../photos/entities/photo.entity';
import { PhotographerProfile } from '../photographers/entities/photographer-profile.entity';
import { User } from '../users/entities/user.entity';
import { Payout } from './entities/payout.entity';
import { RevenueLedgerEntry } from './entities/revenue-ledger-entry.entity';
import { RevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payout,
      OrderItem,
      Order,
      Photo,
      Album,
      User,
      PhotographerProfile,
      RevenueLedgerEntry,
    ]),
    NotificationsModule,
    PaymentsModule,
    ConfigModule,
  ],
  controllers: [RevenueController],
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}
